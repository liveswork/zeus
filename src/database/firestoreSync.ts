// src/database/firestoreSync.ts

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
    if (unsubscribeSnapshot) return;

    telemetryService.track('SYNC_LIVE_PULL_START', {
      collection: firestoreCollectionName
    });

    const q = query(
      firestoreCol,
      orderBy('updatedAt', 'desc'),
      limit(25) // maior que antes -> menos roundtrip
    );

    unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {

        snapshot.docChanges().forEach(change => {

          if (change.type === 'added' || change.type === 'modified') {

            const docData = change.doc.data();

            if (docData.updatedAt instanceof Timestamp) {
              docData.updatedAt =
                docData.updatedAt.toDate().toISOString();
            }

            pullStream$.next({
              documents: [docData],
              checkpoint: { updatedAt: docData.updatedAt }
            });
          }
        });
      },
      (error) => {

        telemetryService.track('SYNC_STREAM_ERROR', {
          collection: firestoreCollectionName,
          code: error.code
        });

        if (error.code !== 'permission-denied') {
          console.error(`Erro stream ${firestoreCollectionName}`, error);
        }
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
        if (docData.updatedAt &&
          typeof docData.updatedAt !== 'string') {

          docData.updatedAt =
            docData.updatedAt.toDate().toISOString();
        }

        return docData;
      },


      handler: async (lastCheckpoint, batchSize) => {

        if (!auth.currentUser)
          return { documents: [], checkpoint: lastCheckpoint };

        let q = query(
          firestoreCol,
          orderBy('updatedAt', 'asc'),
          limit(batchSize)
        );

        if (lastCheckpoint) {
          q = query(q,
            where('updatedAt', '>',
              lastCheckpoint.updatedAt));
        }

        const snapshot = await getDocs(q);

        const documents = snapshot.docs.map(d => {

          const data = d.data();

          if (data.updatedAt instanceof Timestamp) {
            data.updatedAt =
              data.updatedAt.toDate().toISOString();
          }

          return data;
        });

        telemetryService.track('SYNC_PULL_BATCH', {
          collection: firestoreCollectionName,
          count: documents.length
        });

        return {
          documents,
          checkpoint:
            documents.length > 0
              ? { updatedAt: documents.at(-1).updatedAt }
              : lastCheckpoint
        };
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
