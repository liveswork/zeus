// src/services/network/NetworkService.ts
// Este arquivo define o padrão do sistema inteiro.
// Kernel central de execução de rede (Offline-first, Telemetria, Retry)

import { retry } from './retry';
import { NetworkRequest, NetworkResult, NetworkStatus } from './types';
import { telemetryService } from '../telemetry/TelemetryService';
import { exponentialBackoff } from './retryPolicy';

let retryAttempt = 0;

class NetworkService {
  private status: NetworkStatus = navigator.onLine ? 'ONLINE' : 'OFFLINE';

  constructor() {
    // Monitoramento direto do estado da rede (OS / Browser)
    window.addEventListener('online', async () => {
      this.status = 'RECONNECTING';

      telemetryService.track('NETWORK_ONLINE');

      // 🧠 Auto-healing
      const { syncEngine } = await import('../sync/SyncEngine');

      syncEngine.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.status = 'OFFLINE';

      telemetryService.track('NETWORK_OFFLINE');
    });
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'ONLINE' || this.status === 'RECONNECTING';
  }

  async execute<T>(
    request: NetworkRequest<T>
  ): Promise<NetworkResult<T>> {

    // 🚫 Bloqueia execução se a rede já está offline
    if (!this.isOnline()) {
      telemetryService.track('NETWORK_BLOCKED_EXECUTION', {
        key: request.key
      });

      return {
        ok: false,
        offline: true,
        error: 'OFFLINE'
      };
    }

    try {
      // Execução com retry automático se permitido
      const data = request.retryable !== false
        ? await retry(request.execute)
        : await request.execute();

      // 🟢 Rede saudável novamente
      this.status = 'ONLINE';

      // Se houve tentativas anteriores, considera recuperação
      if (retryAttempt > 0) {

        telemetryService.track('NETWORK_RECOVERED', {
          attempts: retryAttempt
        });

        retryAttempt = 0;

        // 🔥 dispara sync automaticamente
        const { syncEngine } = await import('../sync/SyncEngine');
        syncEngine.triggerSync();
      }

      return {
        ok: true,
        data
      };
    } catch (err: any) {
      console.error(`[NetworkService] ${request.key}`, err);

      // 🌐 Rede caiu durante a execução
      if (!navigator.onLine) {
        this.status = 'OFFLINE';

        retryAttempt++;

        const delay = exponentialBackoff(retryAttempt);

        telemetryService.track('NETWORK_RETRY', {
          attempt: retryAttempt,
          delay,
          key: request.key
        });

        return {
          ok: false,
          offline: true,
          error: 'NETWORK_LOST'
        };
      }

      // ⚠️ Erro sem perda total de conectividade
      this.status = 'UNSTABLE';

      telemetryService.track('NETWORK_ERROR', {
        key: request.key,
        message: err?.message
      });

      return {
        ok: false,
        error: err?.message || 'NETWORK_ERROR'
      };
    }
  }
}

export const networkService = new NetworkService();
