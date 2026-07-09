import type { NoteRecord, PairingRecord } from '../domain/types';
import { syncNote } from './desktopSyncClient';

const pairing: PairingRecord = {
  desktop_id: 'desktop-1',
  desktop_name: 'Studio Mac',
  desktop_fingerprint: 'fingerprint-123',
  host: '192.168.1.20',
  port: 4817,
  last_successful_connection_at: null,
};

const note: NoteRecord = {
  id: 'note-1',
  created_at: '2026-07-09T20:00:00.000Z',
  updated_at: '2026-07-09T20:10:00.000Z',
  title: 'Optional',
  text: 'remember the thing',
  source: 'typed',
  sync_status: 'queued',
  last_sync_attempt_at: null,
  desktop_acknowledged_at: null,
};

test('posts text capture payload with bearer authorization', async () => {
  const fetcher = jest.fn(async () => ({
    ok: true,
    status: 202,
    json: async () => ({ acknowledged: true }),
  }));

  await expect(syncNote(note, pairing, 'token-123', fetcher)).resolves.toEqual({
    ok: true,
  });

  expect(fetcher).toHaveBeenCalledWith('http://192.168.1.20:4817/api/phone/captures', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer token-123',
      'Content-Type': 'application/json',
      'X-Phone-Desktop-Id': 'desktop-1',
    },
    body: JSON.stringify({
      id: 'note-1',
      created_at: '2026-07-09T20:00:00.000Z',
      updated_at: '2026-07-09T20:10:00.000Z',
      title: 'Optional',
      text: 'remember the thing',
      source: 'typed',
    }),
  });
});

test('treats missing acknowledgement as a failed sync', async () => {
  const fetcher = jest.fn(async () => ({
    ok: true,
    status: 202,
    json: async () => ({ accepted: true }),
  }));

  await expect(syncNote(note, pairing, 'token-123', fetcher)).resolves.toEqual({
    ok: false,
    reason: 'Desktop did not acknowledge the capture.',
  });
});

test('returns structured failure for unreachable desktop', async () => {
  const fetcher = jest.fn(async () => {
    throw new Error('Network request failed');
  });

  await expect(syncNote(note, pairing, 'token-123', fetcher)).resolves.toEqual({
    ok: false,
    reason: 'Network request failed',
  });
});

test('returns structured failure for desktop rejection', async () => {
  const fetcher = jest.fn(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'bad token' }),
  }));

  await expect(syncNote(note, pairing, 'token-123', fetcher)).resolves.toEqual({
    ok: false,
    reason: 'Desktop rejected capture with HTTP 401.',
  });
});
