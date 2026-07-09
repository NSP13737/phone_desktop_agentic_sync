# Phone App MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first Expo phone app that captures typed notes, stores them locally, pairs with a desktop QR payload, syncs over local HTTP, and cleans up synced notes.

**Architecture:** Create a new Expo TypeScript app in `phone_app/`. Keep note storage, pairing credential storage, QR validation, and sync client in focused modules consumed by a small React Native UI. Use tests for pure behavior and repository modules before wiring screens.

**Tech Stack:** Expo, React Native, TypeScript, Expo SQLite, Expo SecureStore, Expo Camera, Jest.

## Global Constraints

- Use React Native with Expo.
- Save ordinary app data in SQLite.
- Store pairing secrets and sync tokens in secure device storage.
- Sync sends text and metadata only.
- QR payloads are JSON.
- Future sync uses stored bearer-token-style credentials.
- Synced notes are read-only on the phone.
- Delete only notes that are already marked `synced`.

---

### Task 1: Scaffold Expo App And Test Harness

**Files:**
- Create: `phone_app/`
- Create: `phone_app/src/domain/types.ts`
- Create: `phone_app/src/domain/status.ts`
- Test: `phone_app/src/domain/status.test.ts`

**Interfaces:**
- Produces: `SyncStatus`, `NoteRecord`, `isEditableStatus(status: SyncStatus): boolean`, `isDeletableStatus(status: SyncStatus): boolean`.

- [ ] **Step 1: Scaffold Expo**

Run: `runuser -u agent -- bash -lc 'cd /home/agent/obsidian_notetaker/.worktrees/phone-app && npx create-expo-app@latest phone_app --template blank-typescript --yes --no-agents-md'`

- [ ] **Step 2: Add test dependencies**

Run: `runuser -u agent -- bash -lc 'cd /home/agent/obsidian_notetaker/.worktrees/phone-app/phone_app && npm install --save-dev jest ts-jest @types/jest react-test-renderer @testing-library/react-native'`

- [ ] **Step 3: Add domain test**

Create `src/domain/status.test.ts`:

```ts
import { isDeletableStatus, isEditableStatus } from './status';

test('only unsynced note statuses are editable', () => {
  expect(isEditableStatus('draft_local')).toBe(true);
  expect(isEditableStatus('queued')).toBe(true);
  expect(isEditableStatus('sync_failed')).toBe(true);
  expect(isEditableStatus('syncing')).toBe(false);
  expect(isEditableStatus('synced')).toBe(false);
});

test('only synced notes are locally deletable by cleanup', () => {
  expect(isDeletableStatus('synced')).toBe(true);
  expect(isDeletableStatus('queued')).toBe(false);
  expect(isDeletableStatus('sync_failed')).toBe(false);
});
```

- [ ] **Step 4: Verify red**

Run: `npm test -- --runInBand src/domain/status.test.ts`
Expected: FAIL because `./status` does not exist.

- [ ] **Step 5: Implement domain types**

Create `src/domain/types.ts` with `SyncStatus`, `NoteRecord`, `PairingRecord`, and `DesktopPairingPayload`.
Create `src/domain/status.ts` with `isEditableStatus` and `isDeletableStatus`.

- [ ] **Step 6: Verify green**

Run: `npm test -- --runInBand src/domain/status.test.ts`
Expected: PASS.

### Task 2: Add Pairing Validation And Secure Credential Store

**Files:**
- Create: `phone_app/src/pairing/pairingPayload.ts`
- Create: `phone_app/src/pairing/secureTokenStore.ts`
- Test: `phone_app/src/pairing/pairingPayload.test.ts`

**Interfaces:**
- Consumes: `DesktopPairingPayload`.
- Produces: `parsePairingPayload(raw: string): DesktopPairingPayload`, `SecureTokenStore`.

- [ ] **Step 1: Add failing pairing tests**

Test valid JSON payload parsing and rejection of wrong app, unsupported version, missing host, and invalid port.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand src/pairing/pairingPayload.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement validation and token wrapper**

Use strict runtime checks for `app = "obsidian-notetaker"`, `v = 1`, non-empty ids/secrets, and integer port range `1..65535`. Wrap `expo-secure-store` behind `saveSyncToken`, `getSyncToken`, and `deleteSyncToken`.

- [ ] **Step 4: Verify green**

Run: `npm test -- --runInBand src/pairing/pairingPayload.test.ts`
Expected: PASS.

### Task 3: Add SQLite Note Store

**Files:**
- Create: `phone_app/src/storage/noteStore.ts`
- Test: `phone_app/src/storage/noteStore.test.ts`

**Interfaces:**
- Consumes: `NoteRecord`, `SyncStatus`.
- Produces: `createNoteStore(db: SQLiteDatabase): NoteStore`.

- [ ] **Step 1: Add failing storage tests**

Test schema initialization, upsert/list, synced-readonly update rejection, `markSynced`, `markSyncFailed`, and delete-only-synced cleanup.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand src/storage/noteStore.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement store**

Use Expo SQLite async APIs. Keep note writes parameterized, sort newest updated first, and prevent `updateNoteText` from changing `synced` notes.

- [ ] **Step 4: Verify green**

Run: `npm test -- --runInBand src/storage/noteStore.test.ts`
Expected: PASS.

### Task 4: Add Desktop Sync Client

**Files:**
- Create: `phone_app/src/sync/desktopSyncClient.ts`
- Test: `phone_app/src/sync/desktopSyncClient.test.ts`

**Interfaces:**
- Consumes: `NoteRecord`, `PairingRecord`, token from `SecureTokenStore`.
- Produces: `syncNote(note, pairing, token): Promise<SyncResult>`.

- [ ] **Step 1: Add failing sync tests**

Test POST URL construction, bearer authorization header, JSON payload shape, success acknowledgement, and failed response handling.

- [ ] **Step 2: Verify red**

Run: `npm test -- --runInBand src/sync/desktopSyncClient.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement sync client**

POST text-only payload to `http://host:port/api/phone/captures`, require JSON `{ acknowledged: true }`, and return structured failures without throwing for ordinary unreachable desktop errors.

- [ ] **Step 4: Verify green**

Run: `npm test -- --runInBand src/sync/desktopSyncClient.test.ts`
Expected: PASS.

### Task 5: Wire App UI

**Files:**
- Modify: `phone_app/App.tsx`
- Create: `phone_app/src/hooks/useNotesController.ts`
- Create: `phone_app/src/ui/CurrentNoteScreen.tsx`
- Create: `phone_app/src/ui/PreviousNotesDrawer.tsx`
- Create: `phone_app/src/ui/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `NoteStore`, pairing parser, token store, sync client.
- Produces: usable Expo app screen.

- [ ] **Step 1: Build controller**

Open or create a current draft, debounce text/title saves, expose new-note, note selection, manual sync, pairing, and delete-synced actions.

- [ ] **Step 2: Build current note UI**

Top bar with new note/settings/sync indicator, optional title field, large text editor, and drawer handle.

- [ ] **Step 3: Build previous notes drawer**

Compact list with preview, sync status, note open action, and confirmed delete-all-synced action.

- [ ] **Step 4: Build settings and QR scanner**

Show pairing/connection state, manual host/port fallback, QR scanner using Expo Camera when available, and raw JSON paste fallback for simulator/dev.

- [ ] **Step 5: Verify app checks**

Run: `npm test -- --runInBand`
Run: `npm run lint`
Run: `npx tsc --noEmit`
Expected: all pass or unsupported generated lint script is documented.

### Task 6: Update Progress

**Files:**
- Modify: `IMPLEMENTATION_PROGRESS.md`

- [ ] **Step 1: Add high-level progress line**

Record that the Expo phone app scaffold and MVP typed capture loop were added under `phone_app/`.

- [ ] **Step 2: Final verification**

Run the test/typecheck commands again and record any limitations.
