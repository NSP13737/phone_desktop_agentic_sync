import type { SyncStatus } from './types';

export function isEditableStatus(status: SyncStatus): boolean {
  return status === 'draft_local' || status === 'queued' || status === 'sync_failed';
}

export function isDeletableStatus(status: SyncStatus): boolean {
  return status === 'synced';
}
