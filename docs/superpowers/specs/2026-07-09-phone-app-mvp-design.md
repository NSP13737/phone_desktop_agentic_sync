# Phone App MVP Design

## Goal

Build the first usable phone app as a simple personal typed-capture inbox that saves notes locally and can hand them to the desktop companion later.

## Scope

The app lives in `phone_app/` and uses React Native with Expo. The MVP includes typed note capture, local note persistence, a recent-notes drawer, desktop pairing by QR payload, bearer-token sync over local HTTP, and cleanup of notes already marked synced. Native audio/transcription work is out of scope.

## Architecture

The app keeps storage, pairing, and sync behind small TypeScript modules so UI components do not know SQLite schemas, secure-token keys, or HTTP details. The UI opens directly to a current note screen and keeps a blank note ready. Unsynced notes remain editable; synced notes are read-only.

## Components

- `src/domain`: note and pairing types plus status labels.
- `src/storage`: SQLite-backed notes and SecureStore-backed sync credentials.
- `src/sync`: desktop pairing payload validation and local HTTP sync client.
- `src/hooks`: stateful app orchestration for notes, autosave, pairing, and sync.
- `src/ui`: current note editor, previous notes drawer, settings, and QR scanner.

## Data Flow

Text edits debounce into SQLite. Notes with non-empty text are queued for sync. Pairing stores non-secret desktop route data in SQLite-compatible app state and the sync token in SecureStore. Sync sends JSON note payloads to the last known desktop endpoint with a bearer token; a durable acknowledgement marks the note synced.

## Error Handling

Local save failures surface in the editor while keeping current text in memory. Failed sync leaves notes visible and queued or failed locally. Invalid QR payloads are rejected before storage. Delete-all-synced removes only notes with `sync_status = synced`.

## Testing

Unit tests cover note lifecycle logic, QR payload validation, sync acknowledgement behavior, and synced-note deletion. UI implementation is verified with Expo/TypeScript checks for this first scaffold.
