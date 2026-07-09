export type SyncStatus =
  | 'draft_local'
  | 'queued'
  | 'syncing'
  | 'synced'
  | 'sync_failed';

export type NoteSource = 'typed';

export type NoteRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
  text: string;
  source: NoteSource;
  sync_status: SyncStatus;
  last_sync_attempt_at: string | null;
  desktop_acknowledged_at: string | null;
};

export type DesktopPairingPayload = {
  v: 1;
  app: 'obsidian-notetaker';
  desktop_id: string;
  desktop_name: string;
  host: string;
  port: number;
  pairing_id: string;
  pairing_secret: string;
  desktop_fingerprint: string;
};

export type PairingRecord = {
  desktop_id: string;
  desktop_name: string;
  desktop_fingerprint: string;
  host: string;
  port: number;
  last_successful_connection_at: string | null;
};
