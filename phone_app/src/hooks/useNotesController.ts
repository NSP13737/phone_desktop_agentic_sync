import * as SQLite from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NoteRecord, PairingRecord } from '../domain/types';
import { parsePairingPayload } from '../pairing/pairingPayload';
import { secureTokenStore } from '../pairing/secureTokenStore';
import { syncNote } from '../sync/desktopSyncClient';
import { createNoteStore } from '../storage/noteStore';
import { createPairingStore } from '../storage/pairingStore';

type ConnectionState = 'unpaired' | 'paired' | 'syncing' | 'sync_error';

export type NotesController = {
  currentNote: NoteRecord | null;
  notes: NoteRecord[];
  pairing: PairingRecord | null;
  connectionState: ConnectionState;
  error: string | null;
  setTitle(title: string): void;
  setText(text: string): void;
  createNewNote(): Promise<void>;
  openNote(id: string): Promise<void>;
  pairFromQr(rawPayload: string): Promise<void>;
  updateManualAddress(host: string, port: number): void;
  syncQueuedNotes(): Promise<void>;
  deleteSyncedNotes(): Promise<void>;
  clearError(): void;
};

const db = SQLite.openDatabaseSync('phone-notes.db');

export function useNotesController(): NotesController {
  const store = useMemo(() => createNoteStore(db), []);
  const pairingStore = useMemo(() => createPairingStore(db), []);
  const [currentNote, setCurrentNote] = useState<NoteRecord | null>(null);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [pairing, setPairing] = useState<PairingRecord | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('unpaired');
  const [error, setError] = useState<string | null>(null);

  const reloadNotes = useCallback(async () => {
    setNotes(await store.listNotes());
  }, [store]);

  const createNewNote = useCallback(async () => {
    const now = new Date().toISOString();
    const next: NoteRecord = {
      id: createId(),
      created_at: now,
      updated_at: now,
      title: null,
      text: '',
      source: 'typed',
      sync_status: 'draft_local',
      last_sync_attempt_at: null,
      desktop_acknowledged_at: null,
    };

    await store.upsertNote(next);
    setCurrentNote(next);
    await reloadNotes();
  }, [reloadNotes, store]);

  useEffect(() => {
    let cancelled = false;

    async function initialize(): Promise<void> {
      try {
        await store.initialize();
        await pairingStore.initialize();
        const storedPairing = await pairingStore.getPairing();
        const existing = await store.listNotes();
        if (cancelled) return;
        if (storedPairing) {
          setPairing(storedPairing);
          setConnectionState('paired');
        }
        setNotes(existing);
        const editable = existing.find((note) => note.sync_status !== 'synced');
        if (editable) {
          setCurrentNote(editable);
        } else {
          await createNewNote();
        }
      } catch (caught) {
        setError(errorMessage(caught));
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [createNewNote, pairingStore, store]);

  const persistCurrent = useCallback(
    async (note: NoteRecord) => {
      try {
        await store.upsertNote(note);
        await reloadNotes();
      } catch (caught) {
        setError(errorMessage(caught));
      }
    },
    [reloadNotes, store],
  );

  const setTitle = useCallback(
    (title: string) => {
      if (!currentNote || currentNote.sync_status === 'synced') return;
      const updated = {
        ...currentNote,
        title: title.trim().length > 0 ? title : null,
        updated_at: new Date().toISOString(),
        sync_status: 'queued' as const,
      };
      setCurrentNote(updated);
      void persistCurrent(updated);
    },
    [currentNote, persistCurrent],
  );

  const setText = useCallback(
    (text: string) => {
      if (!currentNote || currentNote.sync_status === 'synced') return;
      const updated = {
        ...currentNote,
        text,
        updated_at: new Date().toISOString(),
        sync_status: text.trim().length > 0 ? ('queued' as const) : ('draft_local' as const),
      };
      setCurrentNote(updated);
      void persistCurrent(updated);
    },
    [currentNote, persistCurrent],
  );

  const openNote = useCallback(
    async (id: string) => {
      const note = await store.getNote(id);
      if (note) setCurrentNote(note);
    },
    [store],
  );

  const pairFromQr = useCallback(async (rawPayload: string) => {
    try {
      const payload = parsePairingPayload(rawPayload);
      const paired: PairingRecord = {
        desktop_id: payload.desktop_id,
        desktop_name: payload.desktop_name,
        desktop_fingerprint: payload.desktop_fingerprint,
        host: payload.host,
        port: payload.port,
        last_successful_connection_at: null,
      };
      await secureTokenStore.saveSyncToken(payload.pairing_secret);
      await pairingStore.savePairing(paired);
      setPairing(paired);
      setConnectionState('paired');
      setError(null);
    } catch (caught) {
      setConnectionState('sync_error');
      setError(errorMessage(caught));
    }
  }, [pairingStore]);

  const updateManualAddress = useCallback(
    (host: string, port: number) => {
      if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
        setError('Enter a valid host and port.');
        return;
      }

      setPairing((existing) => {
        if (!existing) return existing;
        const updated = { ...existing, host, port };
        void pairingStore.savePairing(updated);
        return updated;
      });
    },
    [pairingStore],
  );

  const syncQueuedNotes = useCallback(async () => {
    if (!pairing) {
      setError('Pair a desktop before syncing.');
      return;
    }

    const token = await secureTokenStore.getSyncToken();
    if (!token) {
      setError('Missing sync token. Pair the desktop again.');
      setConnectionState('sync_error');
      return;
    }

    setConnectionState('syncing');
    const queued = (await store.listNotes()).filter(
      (note) =>
        note.text.trim().length > 0 &&
        (note.sync_status === 'queued' || note.sync_status === 'sync_failed'),
    );

    for (const note of queued) {
      const attemptedAt = new Date().toISOString();
      await store.markSyncing(note.id, attemptedAt);
      const result = await syncNote(note, pairing, token);
      if (result.ok) {
        await store.markSynced(note.id, new Date().toISOString());
      } else {
        await store.markSyncFailed(note.id, new Date().toISOString());
        setError(result.reason);
        setConnectionState('sync_error');
      }
    }

    await reloadNotes();
    const refreshedCurrent = currentNote ? await store.getNote(currentNote.id) : null;
    if (refreshedCurrent) setCurrentNote(refreshedCurrent);
    setConnectionState((state) => (state === 'sync_error' ? state : 'paired'));
  }, [currentNote, pairing, reloadNotes, store]);

  const deleteSyncedNotes = useCallback(async () => {
    await store.deleteSyncedNotes();
    await reloadNotes();
    if (currentNote?.sync_status === 'synced') {
      await createNewNote();
    }
  }, [createNewNote, currentNote, reloadNotes, store]);

  return {
    currentNote,
    notes,
    pairing,
    connectionState,
    error,
    setTitle,
    setText,
    createNewNote,
    openNote,
    pairFromQr,
    updateManualAddress,
    syncQueuedNotes,
    deleteSyncedNotes,
    clearError: () => setError(null),
  };
}

function createId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
