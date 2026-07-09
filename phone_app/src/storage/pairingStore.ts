import type { PairingRecord } from '../domain/types';

export type PairingDatabaseLike = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
};

export type PairingStore = {
  initialize(): Promise<void>;
  savePairing(pairing: PairingRecord): Promise<void>;
  getPairing(): Promise<PairingRecord | null>;
  updateAddress(host: string, port: number): Promise<void>;
};

export function createPairingStore(db: PairingDatabaseLike): PairingStore {
  return {
    async initialize(): Promise<void> {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pairing (
          desktop_id TEXT PRIMARY KEY NOT NULL,
          desktop_name TEXT NOT NULL,
          desktop_fingerprint TEXT NOT NULL,
          host TEXT NOT NULL,
          port INTEGER NOT NULL,
          last_successful_connection_at TEXT
        );
      `);
    },

    async savePairing(pairing: PairingRecord): Promise<void> {
      await db.runAsync(
        `INSERT INTO pairing (
          desktop_id,
          desktop_name,
          desktop_fingerprint,
          host,
          port,
          last_successful_connection_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(desktop_id) DO UPDATE SET
          desktop_name = excluded.desktop_name,
          desktop_fingerprint = excluded.desktop_fingerprint,
          host = excluded.host,
          port = excluded.port,
          last_successful_connection_at = excluded.last_successful_connection_at`,
        pairing.desktop_id,
        pairing.desktop_name,
        pairing.desktop_fingerprint,
        pairing.host,
        pairing.port,
        pairing.last_successful_connection_at,
      );
    },

    async getPairing(): Promise<PairingRecord | null> {
      return db.getFirstAsync<PairingRecord>('SELECT * FROM pairing LIMIT 1');
    },

    async updateAddress(host: string, port: number): Promise<void> {
      const pairing = await this.getPairing();
      if (!pairing) return;
      await this.savePairing({ ...pairing, host, port });
    },
  };
}
