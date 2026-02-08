export type AuthMode =
  | 'ANONYMOUS'
  | 'OFFLINE_AUTHENTICATED'
  | 'ONLINE_AUTHENTICATED';

export interface LocalSession {
  uid: string;
  issuedAt: number;
  deviceId: string;
  mode: 'offline' | 'online';
  integrityHash: string;
}
export interface RemoteSession {
  uid: string;
  token: string;
  issuedAt: number;
  expiresAt: number;
  mode: 'online';
}