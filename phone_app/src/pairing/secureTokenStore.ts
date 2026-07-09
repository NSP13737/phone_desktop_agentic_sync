import * as SecureStore from 'expo-secure-store';

const SYNC_TOKEN_KEY = 'obsidian-notetaker.sync-token';

export type SecureTokenStore = {
  saveSyncToken(token: string): Promise<void>;
  getSyncToken(): Promise<string | null>;
  deleteSyncToken(): Promise<void>;
};

export const secureTokenStore: SecureTokenStore = {
  async saveSyncToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(SYNC_TOKEN_KEY, token);
  },

  async getSyncToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SYNC_TOKEN_KEY);
  },

  async deleteSyncToken(): Promise<void> {
    await SecureStore.deleteItemAsync(SYNC_TOKEN_KEY);
  },
};
