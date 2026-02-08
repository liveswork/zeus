import { getDatabase } from './db';
import { telemetryService } from '../services/telemetry/TelemetryService';
import { withTimeout } from '../utils/withTimeout';

let cachedDb: any = null;

export async function getDatabaseSafely() {
  if (cachedDb) return cachedDb;

  try {

    cachedDb = await withTimeout(getDatabase(), 8000);

    return cachedDb;

  } catch (error) {

    console.error('🔥 Database boot failed', error);

    telemetryService.track('DB_BOOT_FAILURE', {
      error: String(error)
    });

    // tenta recuperação fria
    return await coldRebuild();
  }
}

async function coldRebuild() {

  console.warn('🧊 Initiating cold database rebuild...');

  telemetryService.track('DB_COLD_REBUILD');

  try {

    const db = await getDatabase();

    await db.destroy();

  } catch (e) {

    console.warn('Previous DB already unusable.');
  }

  cachedDb = null;

  // recria limpa
  cachedDb = await getDatabase();

  telemetryService.track('DB_REBUILT_SUCCESS');

  return cachedDb;
}
