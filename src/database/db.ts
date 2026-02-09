import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'; // 🟢 OBRIGATÓRIO PARA O ERRO DVM1
import { productSchema, customerSchema, userSchema } from './schema';
import { syncFirestore } from './firestoreSync';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

// Adiciona tipos necessários
import type { RxStorageDexie } from 'rxdb/plugins/storage-dexie';

// Adiciona plugins essenciais
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

// Ativa modo Dev e logs se estiver em desenvolvimento
if (import.meta.env.DEV) {
    addRxPlugin(RxDBDevModePlugin);
}

// Interface global para o Singleton (evita recriar o banco no HMR)
declare global {
    interface Window {
        __zeus_db_promise__?: Promise<RxDatabase>;
    }
}

export const getDatabase = () => {
    if (typeof window !== 'undefined' && window.__zeus_db_promise__) {
        return window.__zeus_db_promise__;
    }

    const dbPromise = _createDatabase();
    
    if (typeof window !== 'undefined') {
        window.__zeus_db_promise__ = dbPromise;
    }

    return dbPromise;
};

const _createDatabase = async () => {
    console.log("⚡ Iniciando ZeusDB Neural Core...");


    let storage;

    if (import.meta.env.DEV) {
        // Em modo DEV, usamos o validador AJV
        storage = wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        });
    } else {
        // Em produção, usamos o storage Dexie diretamente
        storage = getRxStorageDexie();
    }

    const db = await createRxDatabase({
        name: 'zeusdb_v21',
        storage: storage,
        multiInstance: false,
        // ignoreDuplicate: false 
    });

    console.log("📂 Verificando coleções...");
    
    const collectionsToAdd: any = {};
    
    // Verifica se as coleções já existem antes de adicionar
    if (!db.collections.products) collectionsToAdd.products = { schema: productSchema };
    if (!db.collections.customers) collectionsToAdd.customers = { schema: customerSchema };
    if (!db.collections.users) collectionsToAdd.users = {
   schema: userSchema,
   migrationStrategies: {
      1: (oldDoc:any) => oldDoc
   }
};

    if (Object.keys(collectionsToAdd).length > 0) {
        await db.addCollections(collectionsToAdd);
    }

    console.log("🔗 Iniciando Matrix de Sincronização...");
    
    // Tenta iniciar a sincronização (pode falhar se não tiver firestoreSync.ts, mas não trava o app)
    try {
        syncFirestore(db.products, 'products');
        syncFirestore(db.customers, 'customers');
       // syncFirestore(db.users, 'users');
    } catch (e) {
        console.warn("Sync não iniciado (verifique se firestoreSync.ts existe)", e);
    }

    return db;
};