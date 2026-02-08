// src/contexts/NetworkContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';

import { networkService } from '../services/network/NetworkService';
import { NetworkStatus } from '../services/network/types';

export interface NetworkContextValue {
  status: NetworkStatus;
  isOnline: boolean;
  isHydrated: boolean;
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined
);

async function realInternetCheck() {
  const urls = [
    "https://clients3.google.com/generate_204",
    "https://www.gstatic.com/generate_204"
  ];

  for (const url of urls) {
    try {
      await fetch(url, {
        method: "GET",
        cache: "no-store",
        mode: "no-cors"
      });

      return true;
    } catch {}
  }

  return false;
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>('OFFLINE');
  const [isHydrated, setIsHydrated] = useState(false);

  const syncStatus = useCallback(async () => {
    const hasInternet = await realInternetCheck();

    setStatus(hasInternet ? 'ONLINE' : 'OFFLINE');

    if (!isHydrated) {
      setIsHydrated(true);
    }
  }, [isHydrated]);

  useEffect(() => {
    syncStatus(); // FIRST CHECK (crítico)

    const handleOnline = syncStatus;
    const handleOffline = syncStatus;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // polling saudável
    const interval = setInterval(syncStatus, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncStatus]);

  return (
    <NetworkContext.Provider
      value={{
        status,
        isOnline: status === 'ONLINE',
        isHydrated,
        refresh: syncStatus
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error(
      'useNetwork must be used within a NetworkProvider'
    );
  }

  return context;
}
