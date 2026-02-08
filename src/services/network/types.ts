// src/services/network/types.ts

export type NetworkStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'RECONNECTING'
  | 'UNSTABLE';

export interface NetworkRequest<T = any> {
  key: string;               // identificador lógico da request
  execute: () => Promise<T>; // função real de rede
  retryable?: boolean;
}

export interface NetworkResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
}