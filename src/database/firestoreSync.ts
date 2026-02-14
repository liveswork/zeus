// src/database/firestoreSync.ts

import { getDatabaseSafely } from '../database/databaseGuardian';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc,
  onSnapshot,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

import { Subject } from 'rxjs';
import { RxCollection } from 'rxdb';
import { db as firebaseDb, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { telemetryService } from '../services/telemetry/TelemetryService';


// jitter para evitar sync storm
const jitter = (base: number) =>
  base + Math.floor(Math.random() * 2000);


// controle de concorrência local
const writeLocks = new Set<string>();

function toIsoDate(v: any): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;

  // Firestore Timestamp-like (admin/sdk ou objeto serializado)
  if (typeof v === "object" && typeof v.seconds === "number") {
    return new Date(v.seconds * 1000).toISOString();
  }

  // Firestore Timestamp real (client)
  if (typeof v?.toDate === "function") {
    return v.toDate().toISOString();
  }

  return undefined;
}

function normalizeUser(doc: any) {
  const name =
    doc.name ??
    doc.displayName ??
    doc.companyName ??
    (doc.email ? String(doc.email).split("@")[0] : "Sem nome");

  return {
    ...doc,
    id: doc.id ?? doc.uid, // garante id
    businessId: doc.businessId ?? doc.uid ?? doc.id, // garante businessId
    name,
    pinHash: doc.pinHash ?? "", // evita quebrar required
    active: doc.active ?? true,
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoDate(doc.updatedAt) ?? new Date().toISOString()
  };
}

function normalizeProduct(doc: any) {
  const updatedAt =
    toIsoDate(doc.updatedAt) ??
    toIsoDate(doc.createdAt) ??
    new Date().toISOString();

  return {
    ...doc,
    id: doc.id ?? doc._id ?? doc.uid, // id sempre
    updatedAt,
    createdAt: toIsoDate(doc.createdAt) ?? updatedAt,
    name: doc.name ?? doc.title ?? "", // garante required
  };
}

type UpdatedAtCheckpoint = { updatedAt: string };
type MaybeCheckpoint = UpdatedAtCheckpoint | null | undefined;

export const syncFirestore = async (
  rxCollection: RxCollection,
  firestoreCollectionName: string
) => {

  const firestoreCol = collection(firebaseDb, firestoreCollectionName);
  const replicationIdentifier = `firestore-${firestoreCollectionName}`;

  const pullStream$ = new Subject<any>();

  let unsubscribeSnapshot: (() => void) | null = null;



  // ===============================
  // LIVE PULL (escuta inteligente)
  // ===============================

  const startLivePull = () => {
    if (!auth.currentUser) return;

    if (unsubscribeSnapshot) return;

    telemetryService.track('SYNC_LIVE_PULL_START', {
      collection: firestoreCollectionName
    });

    const uid = auth.currentUser!.uid;

    const q = firestoreCollectionName === 'products'
      ? query(
        firestoreCol,
        where('businessId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(25)
      )
      : query(
        firestoreCol,
        orderBy('updatedAt', 'desc'),
        limit(25)
      );

    unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {

        snapshot.docChanges().forEach(change => {

          if (change.type === 'added' || change.type === 'modified') {

            let docData: any = { id: change.doc.id, ...change.doc.data() };

            if (firestoreCollectionName === "products") {
              docData = normalizeProduct(docData);
            }

            if (firestoreCollectionName === "users") {
              docData = normalizeUser(docData);
            } else {
              // normalização padrão (mantém o que você já fazia)
              if (docData.updatedAt instanceof Timestamp) {
                docData.updatedAt = docData.updatedAt.toDate().toISOString();
              }
              if (docData.createdAt instanceof Timestamp) {
                docData.createdAt = docData.createdAt.toDate().toISOString();
              }
            }

            pullStream$.next({
              documents: [docData],
              checkpoint: { updatedAt: docData.updatedAt }
            });
          }
        });
      },
      (error) => {
        telemetryService.track('SYNC_STREAM_ERROR' as any, {
          collection: firestoreCollectionName,
          code: (error as any)?.code,
          message: (error as any)?.message
        });

        console.error(`[SYNC_STREAM_ERROR] ${firestoreCollectionName}`, error);
      }
    );
  };


  const stopLivePull = () => {
    if (!unsubscribeSnapshot) return;

    unsubscribeSnapshot();
    unsubscribeSnapshot = null;

    telemetryService.track('SYNC_LIVE_PULL_STOP', {
      collection: firestoreCollectionName
    });
  };



  // ===============================
  // REPLICATION
  // ===============================

  const replicationState = await replicateRxCollection({
    collection: rxCollection,
    replicationIdentifier,
    live: true,
    retryTime: jitter(8000),
    waitForLeadership: true,
    autoStart: false,


    // ===============================
    // PULL
    // ===============================

    pull: {
      batchSize: 100, // maior throughput

      modifier: (docData) => {
        if (firestoreCollectionName === "users") {
          return normalizeUser(docData);
        }

        if (docData.updatedAt && typeof docData.updatedAt !== "string") {
          docData.updatedAt = docData.updatedAt.toDate().toISOString();
        }
        if (docData.createdAt && typeof docData.createdAt !== "string") {
          docData.createdAt = docData.createdAt.toDate().toISOString();
        }

        return docData;
      },


      handler: async (lastCheckpoint: MaybeCheckpoint, batchSize) => {
        if (!auth.currentUser) {
          return { documents: [], checkpoint: lastCheckpoint ?? null };
        }

        let q = query(
          firestoreCol,
          where('businessId', '==', auth.currentUser!.uid),
          orderBy('updatedAt', 'asc'),
          limit(batchSize)
        );

        if (lastCheckpoint?.updatedAt) {
          q = query(q, where('updatedAt', '>', lastCheckpoint.updatedAt));
        }

        const snapshot = await getDocs(q);

        const documents = snapshot.docs.map(d => {
          let data: any = { id: d.id, ...d.data() };

          if (firestoreCollectionName === "products") {
            data = normalizeProduct(data);
          }

          if (firestoreCollectionName === "users") {
            data = normalizeUser(data);
          } else {
            data.updatedAt = toIsoDate(data.updatedAt) ?? data.updatedAt;
            data.createdAt = toIsoDate(data.createdAt) ?? data.createdAt;
          }

          return data;
        });

        telemetryService.track('SYNC_PULL_BATCH' as any, {
          collection: firestoreCollectionName,
          count: documents.length
        });

        const checkpoint: UpdatedAtCheckpoint | null =
          documents.length > 0
            ? { updatedAt: documents[documents.length - 1].updatedAt }
            : (lastCheckpoint ?? null);

        return { documents, checkpoint };
      },


      stream$: pullStream$
    },



    // ===============================
    // PUSH — nível Stripe
    // ===============================

    push: {

      batchSize: 50,

      handler: async (docs) => {

        if (!auth.currentUser) return [];

        await Promise.all(
          docs.map(async (d) => {

            const id = d.newDocumentState.id;

            // evita double write local
            if (writeLocks.has(id)) return;
            writeLocks.add(id);

            try {

              const docRef = doc(firestoreCol, id);

              await runTransaction(firebaseDb, async (tx) => {

                const snap = await tx.get(docRef);

                const localVersion =
                  d.newDocumentState.version ?? 0;

                if (snap.exists()) {

                  const remote = snap.data();
                  const remoteVersion = remote.version ?? 0;

                  // proteção contra replay
                  if (remoteVersion > localVersion) {

                    telemetryService.track('SYNC_CONFLICT', {
                      collection: firestoreCollectionName,
                      id
                    });

                    return;
                  }
                }

                tx.set(docRef, {
                  ...d.newDocumentState,
                  version: localVersion + 1,
                  updatedAt: Timestamp.now()
                }, { merge: true });

              });

            } catch (err) {

              telemetryService.track('SYNC_PUSH_ERROR', {
                collection: firestoreCollectionName,
                error: String(err)
              });

              console.error("Push error:", err);

            } finally {
              writeLocks.delete(id);
            }

          })
        );

        return [];
      }
    }
  });



  // ===============================
  // AUTH-AWARE ENGINE
  // ===============================

  onAuthStateChanged(auth, (user) => {

    if (user) {

      telemetryService.track('SYNC_ENGINE_START', {
        collection: firestoreCollectionName
      });

      replicationState.start();
      startLivePull();

    } else {

      telemetryService.track('SYNC_ENGINE_STOP', {
        collection: firestoreCollectionName
      });

      replicationState.cancel();
      stopLivePull();
    }
  });

  return replicationState;
};
