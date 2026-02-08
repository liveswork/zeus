import { networkService } from '../network/NetworkService';
import { telemetryService } from '../telemetry/TelemetryService';

// Evita múltiplas sincronizações simultâneas
let syncing = false;

class SyncEngine {

  async triggerSync() {

    if (syncing) return;

    if (!networkService.isOnline()) return;

    syncing = true;

    telemetryService.track('SYNC_STARTED');

    try {

      /**
       * IMPORTANTE:
       * Aqui você conecta seu Firestore Sync REAL.
       * Vou deixar preparado para plugar.
       */

      const { startFirestoreSync } = await import('../../database/firestoreSync');

      await startFirestoreSync();

      telemetryService.track('SYNC_COMPLETED');

    } catch (err) {

      telemetryService.track('SYNC_FAILED', {
        error: (err as any)?.message
      });

      console.error('[SyncEngine]', err);

    } finally {
      syncing = false;
    }
  }
}

export const syncEngine = new SyncEngine();
