import type { NoteRecord, SyncStatus } from '../domain/types';

export type SQLiteDatabaseLike = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
};

export type NoteStore = {
  initialize(): Promise<void>;
  upsertNote(note: NoteRecord): Promise<void>;
  listNotes(): Promise<NoteRecord[]>;
  getNote(id: string): Promise<NoteRecord | null>;
  updateNoteText(id: string, text: string, updatedAt: string): Promise<void>;
  updateNoteTitle(id: string, title: string | null, updatedAt: string): Promise<void>;
  markSyncing(id: string, attemptedAt: string): Promise<void>;
  markSyncFailed(id: string, attemptedAt: string): Promise<void>;
  markSynced(id: string, acknowledgedAt: string): Promise<void>;
  deleteSyncedNotes(): Promise<number>;
};

export function createNoteStore(db: SQLiteDatabaseLike): NoteStore {
  async function assertEditable(id: string): Promise<void> {
    const note = await getNote(id);
    if (note?.sync_status === 'synced') {
      throw new Error('Synced notes are read-only on the phone.');
    }
  }

  async function getNote(id: string): Promise<NoteRecord | null> {
    return db.getFirstAsync<NoteRecord>('SELECT * FROM notes WHERE id = ?', id);
  }

  return {
    async initialize(): Promise<void> {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          title TEXT,
          text TEXT NOT NULL,
          source TEXT NOT NULL,
          sync_status TEXT NOT NULL,
          last_sync_attempt_at TEXT,
          desktop_acknowledged_at TEXT
        );
      `);
    },

    async upsertNote(note: NoteRecord): Promise<void> {
      await db.runAsync(
        `INSERT INTO notes (
          id,
          created_at,
          updated_at,
          title,
          text,
          source,
          sync_status,
          last_sync_attempt_at,
          desktop_acknowledged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          updated_at = excluded.updated_at,
          title = excluded.title,
          text = excluded.text,
          sync_status = excluded.sync_status,
          last_sync_attempt_at = excluded.last_sync_attempt_at,
          desktop_acknowledged_at = excluded.desktop_acknowledged_at`,
        note.id,
        note.created_at,
        note.updated_at,
        note.title,
        note.text,
        note.source,
        note.sync_status,
        note.last_sync_attempt_at,
        note.desktop_acknowledged_at,
      );
    },

    async listNotes(): Promise<NoteRecord[]> {
      return db.getAllAsync<NoteRecord>('SELECT * FROM notes ORDER BY updated_at DESC');
    },

    getNote,

    async updateNoteText(id: string, text: string, updatedAt: string): Promise<void> {
      await assertEditable(id);
      await db.runAsync(
        'UPDATE notes SET text = ?, sync_status = ?, updated_at = ? WHERE id = ?',
        text,
        'queued',
        updatedAt,
        id,
      );
    },

    async updateNoteTitle(id: string, title: string | null, updatedAt: string): Promise<void> {
      await assertEditable(id);
      await db.runAsync('UPDATE notes SET title = ?, updated_at = ? WHERE id = ?', title, updatedAt, id);
    },

    async markSyncing(id: string, attemptedAt: string): Promise<void> {
      await setSyncStatus(db, id, 'syncing', attemptedAt);
    },

    async markSyncFailed(id: string, attemptedAt: string): Promise<void> {
      await setSyncStatus(db, id, 'sync_failed', attemptedAt);
    },

    async markSynced(id: string, acknowledgedAt: string): Promise<void> {
      await db.runAsync(
        "UPDATE notes SET sync_status = 'synced', desktop_acknowledged_at = ?, last_sync_attempt_at = ? WHERE id = ?",
        acknowledgedAt,
        acknowledgedAt,
        id,
      );
    },

    async deleteSyncedNotes(): Promise<number> {
      const result = await db.runAsync("DELETE FROM notes WHERE sync_status = 'synced'");
      return result.changes;
    },
  };
}

async function setSyncStatus(
  db: SQLiteDatabaseLike,
  id: string,
  status: SyncStatus,
  attemptedAt: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE notes SET sync_status = ?, last_sync_attempt_at = ? WHERE id = ?',
    status,
    attemptedAt,
    id,
  );
}
