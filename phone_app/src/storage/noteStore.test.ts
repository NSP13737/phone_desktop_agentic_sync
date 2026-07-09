import type { NoteRecord, SyncStatus } from '../domain/types';
import { createNoteStore, type SQLiteDatabaseLike } from './noteStore';

type Row = NoteRecord;

class MemoryDb implements SQLiteDatabaseLike {
  rows = new Map<string, Row>();

  async execAsync(): Promise<void> {}

  async runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number }> {
    if (sql.startsWith('INSERT INTO notes')) {
      const note = rowFromParams(params);
      this.rows.set(note.id, note);
      return { changes: 1 };
    }

    if (sql.startsWith('UPDATE notes SET text')) {
      const [text, syncStatus, updatedAt, id] = params as [string, SyncStatus, string, string];
      const note = this.rows.get(id);
      if (!note || note.sync_status === 'synced') return { changes: 0 };
      this.rows.set(id, { ...note, text, sync_status: syncStatus, updated_at: updatedAt });
      return { changes: 1 };
    }

    if (sql.startsWith('UPDATE notes SET title')) {
      const [title, updatedAt, id] = params as [string | null, string, string];
      const note = this.rows.get(id);
      if (!note || note.sync_status === 'synced') return { changes: 0 };
      this.rows.set(id, { ...note, title, updated_at: updatedAt });
      return { changes: 1 };
    }

    if (sql.startsWith("UPDATE notes SET sync_status = 'synced'")) {
      const [ackAt, _lastAttemptAt, id] = params as [string, string, string];
      const note = this.rows.get(id);
      if (!note) return { changes: 0 };
      this.rows.set(id, {
        ...note,
        sync_status: 'synced',
        desktop_acknowledged_at: ackAt,
        last_sync_attempt_at: ackAt,
      });
      return { changes: 1 };
    }

    if (sql.startsWith('UPDATE notes SET sync_status = ?')) {
      const [syncStatus, attemptAt, id] = params as [SyncStatus, string, string];
      const note = this.rows.get(id);
      if (!note) return { changes: 0 };
      this.rows.set(id, { ...note, sync_status: syncStatus, last_sync_attempt_at: attemptAt });
      return { changes: 1 };
    }

    if (sql.startsWith('DELETE FROM notes WHERE sync_status')) {
      let changes = 0;
      for (const [id, note] of this.rows) {
        if (note.sync_status === 'synced') {
          this.rows.delete(id);
          changes += 1;
        }
      }
      return { changes };
    }

    throw new Error(`Unexpected SQL: ${sql}`);
  }

  async getAllAsync<T>(): Promise<T[]> {
    return Array.from(this.rows.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at)) as T[];
  }

  async getFirstAsync<T>(_sql: string, id: unknown): Promise<T | null> {
    return (this.rows.get(String(id)) ?? null) as T | null;
  }
}

function rowFromParams(params: unknown[]): Row {
  const [
    id,
    created_at,
    updated_at,
    title,
    text,
    source,
    sync_status,
    last_sync_attempt_at,
    desktop_acknowledged_at,
  ] = params as [
    string,
    string,
    string,
    string | null,
    string,
    'typed',
    SyncStatus,
    string | null,
    string | null,
  ];

  return {
    id,
    created_at,
    updated_at,
    title,
    text,
    source,
    sync_status,
    last_sync_attempt_at,
    desktop_acknowledged_at,
  };
}

function note(overrides: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id: 'note-1',
    created_at: '2026-07-09T20:00:00.000Z',
    updated_at: '2026-07-09T20:00:00.000Z',
    title: null,
    text: 'first thought',
    source: 'typed',
    sync_status: 'queued',
    last_sync_attempt_at: null,
    desktop_acknowledged_at: null,
    ...overrides,
  };
}

test('initializes schema and stores notes newest first', async () => {
  const db = new MemoryDb();
  const store = createNoteStore(db);

  await store.initialize();
  await store.upsertNote(note({ id: 'older', updated_at: '2026-07-09T20:00:00.000Z' }));
  await store.upsertNote(note({ id: 'newer', updated_at: '2026-07-09T21:00:00.000Z' }));

  expect((await store.listNotes()).map((stored) => stored.id)).toEqual(['newer', 'older']);
});

test('updates unsynced note text and queues it', async () => {
  const db = new MemoryDb();
  const store = createNoteStore(db);
  await store.upsertNote(note({ sync_status: 'sync_failed' }));

  await store.updateNoteText('note-1', 'changed', '2026-07-09T21:00:00.000Z');

  expect(await store.getNote('note-1')).toMatchObject({
    text: 'changed',
    sync_status: 'queued',
  });
});

test('rejects text updates after note is synced', async () => {
  const db = new MemoryDb();
  const store = createNoteStore(db);
  await store.upsertNote(note({ sync_status: 'synced' }));

  await expect(
    store.updateNoteText('note-1', 'changed', '2026-07-09T21:00:00.000Z'),
  ).rejects.toThrow('Synced notes are read-only on the phone.');
});

test('marks notes synced only after acknowledgement', async () => {
  const db = new MemoryDb();
  const store = createNoteStore(db);
  await store.upsertNote(note());

  await store.markSynced('note-1', '2026-07-09T22:00:00.000Z');

  expect(await store.getNote('note-1')).toMatchObject({
    sync_status: 'synced',
    desktop_acknowledged_at: '2026-07-09T22:00:00.000Z',
  });
});

test('deleteSyncedNotes leaves unsynced notes untouched', async () => {
  const db = new MemoryDb();
  const store = createNoteStore(db);
  await store.upsertNote(note({ id: 'synced', sync_status: 'synced' }));
  await store.upsertNote(note({ id: 'failed', sync_status: 'sync_failed' }));

  expect(await store.deleteSyncedNotes()).toBe(1);
  expect((await store.listNotes()).map((stored) => stored.id)).toEqual(['failed']);
});
