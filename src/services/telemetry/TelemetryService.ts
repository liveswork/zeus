export type TelemetryEvent =
  | 'NETWORK_OFFLINE'
  | 'NETWORK_ONLINE'
  | 'NETWORK_RETRY'
  | 'NETWORK_RECOVERED'
  | 'SYNC_ERROR';

interface TelemetryRecord {
  event: TelemetryEvent;
  timestamp: number;
  metadata?: Record<string, any>;
}

class TelemetryService {
  private buffer: TelemetryRecord[] = [];

  track(event: TelemetryEvent, metadata?: Record<string, any>) {
    const record: TelemetryRecord = {
      event,
      timestamp: Date.now(),
      metadata
    };

    this.buffer.push(record);

    // Dev log controlado
    if (import.meta.env.DEV) {
      console.info('[Telemetry]', record);
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    // FUTURO: enviar para backend / BigQuery / Firestore / IA
    this.buffer = [];
  }
}

export const telemetryService = new TelemetryService();
