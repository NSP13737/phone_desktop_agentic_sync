import type { PairingRecord } from '../domain/types';
import { createPairingStore, type PairingDatabaseLike } from './pairingStore';

class MemoryPairingDb implements PairingDatabaseLike {
  pairing: PairingRecord | null = null;

  async execAsync(): Promise<void> {}

  async runAsync(_sql: string, ...params: unknown[]): Promise<{ changes: number }> {
    const [
      desktop_id,
      desktop_name,
      desktop_fingerprint,
      host,
      port,
      last_successful_connection_at,
    ] = params as [string, string, string, string, number, string | null];

    this.pairing = {
      desktop_id,
      desktop_name,
      desktop_fingerprint,
      host,
      port,
      last_successful_connection_at,
    };
    return { changes: 1 };
  }

  async getFirstAsync<T>(): Promise<T | null> {
    return this.pairing as T | null;
  }
}

const pairing: PairingRecord = {
  desktop_id: 'desktop-1',
  desktop_name: 'Studio Mac',
  desktop_fingerprint: 'fingerprint-123',
  host: '192.168.1.20',
  port: 4817,
  last_successful_connection_at: null,
};

test('saves and restores desktop pairing route metadata', async () => {
  const store = createPairingStore(new MemoryPairingDb());

  await store.initialize();
  await store.savePairing(pairing);

  await expect(store.getPairing()).resolves.toEqual(pairing);
});

test('updates manual address without changing trusted identity', async () => {
  const store = createPairingStore(new MemoryPairingDb());
  await store.savePairing(pairing);

  await store.updateAddress('desktop.local', 4900);

  await expect(store.getPairing()).resolves.toEqual({
    ...pairing,
    host: 'desktop.local',
    port: 4900,
  });
});
