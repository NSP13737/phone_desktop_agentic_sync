# Phone App Technical Flow

This document captures the technical flow implied by the phone app diary and UI design. It is intentionally a planning reference, not a final implementation plan.

The current decision is that the phone app is a typed text capture tool for the MVP. It persists text plus minimal metadata. The desktop companion receives text captures.

The current app framework decision is **React Native with Expo**. Details live in `APP_FRAMEWORK.md`.

A high-level Mermaid diagram of the app moving pieces lives in `HIGH_LEVEL_APP_FLOW.md`.

Pairing and future desktop discovery requirements live in `PAIRING_REQUIREMENTS.md`.

## System Boundary

The phone app owns:

- fast typed capture.
- local text note persistence.
- local editing.
- sync queueing.
- handoff to the desktop companion.
- deletion of notes that have already synced.

The phone app does not own:

- Obsidian file routing.
- agentic interpretation.
- Git commits or rollback.
- desktop-side processing visibility.

Those responsibilities belong to the desktop companion.

## High-Level Pipeline

1. User types or edits the current note.
2. The app saves the updated text note locally.
3. The note enters or remains in the sync queue.
4. When the desktop companion is reachable, the phone sends text plus metadata.
5. The desktop companion acknowledges successful receipt.
6. The phone marks the note as synced.
7. The user may delete synced notes from the phone.

## Local Note Lifecycle

Suggested lifecycle states:

- **Draft local**: the current note exists locally and may still be edited.
- **Queued**: the note is saved locally and waiting for desktop handoff.
- **Syncing**: the note is actively being sent to the desktop companion.
- **Synced**: the desktop companion has acknowledged receipt.
- **Sync failed**: the note remains local, but the last handoff attempt failed.

The app should treat all non-deleted notes as locally safe. Failed sync should not imply data loss.

For this iteration, synced notes are read-only on the phone. The app should allow local editing before handoff, but once the desktop companion acknowledges a capture, the phone should not permit further edits to that capture. This avoids conflict-resolution requirements between phone edits and desktop-side processing.

## Capture And Editing Lifecycle

Typed capture is the only MVP input mode.

Suggested editing states:

- **Empty draft**: the current note has no user-entered text yet.
- **Editing**: the user is actively changing text or title.
- **Saved locally**: the latest text has been persisted on the phone.
- **Queued for sync**: the note has local changes that should be handed off to the desktop companion.

The current note should remain editable until it is marked synced. Switching away from the app, opening the drawer, or starting a new note should not require a manual save step.

## Local Persistence

The app should persist the note frequently:

- after text edits, using a debounce appropriate for mobile typing.
- after title edits.
- before switching to a new note.
- before sending a note to the desktop companion.
- when the app backgrounds, when possible.

The saved object should be text-first and small enough to sync cheaply.

For v1, use SQLite for ordinary app data: local notes, sync status, and non-secret pairing metadata such as last known host and port. Use Expo SQLite or the closest maintained SQLite package that works well with the selected Expo development build.

Use secure device storage, such as Expo SecureStore, only for sensitive pairing credentials and tokens. Do not store sync credentials in the ordinary note database.

Suggested fields:

- `id`
- `created_at`
- `updated_at`
- `title`
- `text`
- `source`
- `sync_status`
- `last_sync_attempt_at`
- `desktop_acknowledged_at`

## Sync Handoff

The sync payload should contain only text and metadata.

A likely payload shape:

```json
{
  "id": "note-id",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "title": "optional title",
  "text": "typed note text",
  "source": "typed"
}
```

The desktop companion should return an acknowledgement that lets the phone mark the note as synced.

For v1, the acknowledgement means "received and durably accepted by the desktop companion." It does not mean the desktop has finished routing, interpreting, or writing the note into Obsidian. The phone app should mark a note as `synced` after this desktop receipt acknowledgement.

The sync request should use JSON over local HTTP. The phone authenticates future sync requests with the stored sync token from pairing, sent as a bearer token or equivalent simple authorization header. The desktop must verify the token and the paired device identity before accepting a capture.

## Connection Awareness

The phone app needs a lightweight way to know whether the desktop companion is reachable.

Pairing, trust, discovery, IP address changes, and manual recovery are specified in `PAIRING_REQUIREMENTS.md`.

The UI needs:

- a prominent connection status in settings.
- a quiet sync indicator on the main note screen.
- per-note sync status in the previous notes drawer.

Technical questions for later:

- Whether local service discovery should be added after the MVP last-known-address flow.

For v1, retry sync:

- when the app starts or returns to foreground.
- after a successful pairing.
- when the user opens settings or manually requests sync.
- after a failed attempt using a conservative backoff while the app is active.

Failed sync should leave notes queued locally.

## Delete Synced Notes

The delete-all-synced operation should be conservative.

Rules:

- Delete only notes with `sync_status = synced`.
- Do not delete queued, syncing, failed, or draft-local notes.
- Confirm before bulk deletion.
- Keep deletion local to the phone.

The desktop companion is responsible for its own retention and processing after handoff.

## Failure Handling

Important failure cases:

- Local save fails.
- The app closes while the current note has unsaved changes.
- Desktop companion is unreachable.
- Sync starts but does not complete.
- Desktop acknowledgement is not received.

User-facing principles:

- Local text should remain visible and recoverable whenever possible.
- A failed sync should never hide the note.
- The user should be able to continue editing text notes while disconnected.
- The user should be able to edit unsynced notes, but synced notes should be presented as read-only on the phone for this iteration.

## Open Technical Questions

- Should a future version support post-sync amendments from the phone, and if so, how should those be represented on the desktop?
- Should a future version add local service discovery, or is last-known address plus manual recovery enough?
- Should the app expose manual conflict recovery if local edits somehow happen after desktop acknowledgement?

## Current Technical Decision

For v1 planning, assume:

- React Native with Expo as the app framework.
- Expo Go may be used for early UI/simple API exploration.
- production builds should remain possible for Android APK, Google Play, TestFlight, and App Store distribution.
- SQLite for ordinary local app data.
- secure device storage for pairing secrets and sync tokens.
- text-only saved notes.
- text-only desktop sync.
- actual QR-code local pairing for the MVP, with stored future-sync credentials.
- JSON QR payloads.
- JSON sync requests over local HTTP.
- simple bearer-token-style sync authentication for the MVP.
- desktop acknowledgement means "received and durably accepted by the desktop companion."
- optional title.
- no required organization metadata.
- no `user_edited` metadata field.
- synced notes are read-only on the phone.
