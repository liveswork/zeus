export type BootState =
  | 'INIT'
  | 'DB_READY'
  | 'SESSION_CHECKED'
  | 'READY';
export interface BootProgress {
  state: BootState;
  progress: number;
}