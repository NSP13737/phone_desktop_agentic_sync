import type { NoteRecord, PairingRecord } from '../domain/types';

export type SyncResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

export type SyncFetcher = (url: string, init: RequestInit) => Promise<FetchResponse>;

export async function syncNote(
  note: NoteRecord,
  pairing: PairingRecord,
  token: string,
  fetcher: SyncFetcher = fetch,
): Promise<SyncResult> {
  try {
    const response = await fetcher(`http://${pairing.host}:${pairing.port}/api/phone/captures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Phone-Desktop-Id': pairing.desktop_id,
      },
      body: JSON.stringify({
        id: note.id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        title: note.title,
        text: note.text,
        source: note.source,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Desktop rejected capture with HTTP ${response.status}.`,
      };
    }

    const body = await response.json();
    if (!isAcknowledged(body)) {
      return {
        ok: false,
        reason: 'Desktop did not acknowledge the capture.',
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Desktop is unreachable.',
    };
  }
}

function isAcknowledged(body: unknown): body is { acknowledged: true } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'acknowledged' in body &&
    body.acknowledged === true
  );
}
