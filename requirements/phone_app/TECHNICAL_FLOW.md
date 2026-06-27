# Phone App Technical Flow

This document captures the technical flow implied by the phone app diary and UI design. It is intentionally a planning reference, not a final implementation plan.

The current decision is that the phone app transcribes audio locally and persists only text plus minimal metadata. The desktop companion receives text captures, not audio files.

## System Boundary

The phone app owns:

- fast voice capture.
- temporary audio handling.
- on-device transcription.
- local text note persistence.
- local editing.
- sync queueing.
- handoff to the desktop companion.
- deletion of notes that have already synced.

The phone app does not own:

- Obsidian file routing.
- agentic interpretation.
- Git commits or rollback.
- long-term archival of audio.
- desktop-side processing visibility.

Those responsibilities belong to the desktop companion.

## High-Level Pipeline

1. User records audio in the current note.
2. The app stores audio as temporary working data.
3. A local transcription model converts audio to text.
4. The transcript is inserted into the current note text.
5. The app saves the text note locally.
6. The app discards temporary audio after successful transcription and save.
7. The note enters or remains in the sync queue.
8. When the desktop companion is reachable, the phone sends text plus metadata.
9. The desktop companion acknowledges successful receipt.
10. The phone marks the note as synced.
11. The user may delete synced notes from the phone.

## Local Note Lifecycle

Suggested lifecycle states:

- **Draft local**: the current note exists locally and may still be edited.
- **Queued**: the note is saved locally and waiting for desktop handoff.
- **Syncing**: the note is actively being sent to the desktop companion.
- **Synced**: the desktop companion has acknowledged receipt.
- **Sync failed**: the note remains local, but the last handoff attempt failed.

The app should treat all non-deleted notes as locally safe. Failed sync should not imply data loss.

## Recording Session Lifecycle

Recording is separate from note persistence.

Suggested recording states:

- **Idle**: no active recording.
- **Recording**: audio is being captured.
- **Transcribing**: audio has stopped and the local model is producing text.
- **Transcript inserted**: text has been added to the note.
- **Temporary audio discarded**: the app has removed the transient audio data.

A note may move through this recording lifecycle multiple times. Each recording segment can append text or insert text at the current cursor position.

## Text Insertion Rules

When a transcript segment completes:

- If the user has an active cursor position, insert the transcript there.
- If the user has selected text, replace the selection with the transcript.
- If there is no reliable cursor position, append the transcript to the end.

The app should preserve enough editor state to make voice insertion predictable, especially after the user taps into the middle of a note.

## Local Persistence

The app should persist the note frequently:

- after transcript insertion.
- after manual edits.
- before switching to a new note.
- before sending a note to the desktop companion.
- when the app backgrounds, when possible.

The saved object should be text-first and small enough to sync cheaply.

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
- `transcription_model_id`
- `transcription_language`

## Audio Handling

Audio is working data, not durable user data.

Expected behavior:

- Audio is captured to a temporary location or in-memory buffer.
- Audio may be chunked if the transcription engine benefits from streaming or segment-based processing.
- Audio should be deleted after its transcript segment has been inserted and saved.
- Audio should not appear in the sync payload.
- Audio should not remain after the app is closed except where unavoidable due to crash recovery.

Crash recovery policy still needs to be designed. One possible approach is to keep temporary audio only long enough to recover from an interrupted transcription, then delete it after the next successful app startup cleanup.

## Transcription

The app should use an on-device model for transcription.

Planning requirements:

- It should work without network access.
- It should be fast enough for short voice notes.
- It should support repeated pause/resume recording within one note.
- It should provide enough confidence in the transcript that audio retention is not required for v1.
- It should expose failure states that the UI can communicate simply.

Technology choices are still open. Candidate areas to research later include mobile speech APIs, local Whisper-family runtimes, platform-native transcription, and cross-platform wrappers.

## Sync Handoff

The sync payload should contain only text and metadata.

A likely payload shape:

```json
{
  "id": "note-id",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "title": "optional title",
  "text": "transcribed and edited note text",
  "source": "voice",
  "transcription": {
    "model_id": "optional model id",
    "language": "optional language"
  }
}
```

The desktop companion should return an acknowledgement that lets the phone mark the note as synced.

The acknowledgement should distinguish "received by desktop" from "fully processed into Obsidian" if those become separate states. For the phone app v1, `synced` means handed off to the desktop companion.

## Connection Awareness

The phone app needs a lightweight way to know whether the desktop companion is reachable.

The UI needs:

- a prominent connection status in settings.
- a quiet sync indicator on the main note screen.
- per-note sync status in the previous notes drawer.

Technical questions for later:

- How does the phone discover the desktop companion?
- Does pairing happen through local network discovery, QR code, manual address entry, or another mechanism?
- Does sync require both devices to be on the same local network?
- How are authentication and trust handled?
- How are retries scheduled?

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

- Recording fails to start.
- Transcription fails.
- The app closes while recording or transcribing.
- Local save fails.
- Desktop companion is unreachable.
- Sync starts but does not complete.
- Desktop acknowledgement is not received.

User-facing principles:

- A failed sync should never hide the note.
- A failed transcription should preserve whatever text is already available.
- If temporary audio exists after a failure, the app should either retry transcription or clearly explain that the note has not yet been converted.
- The user should be able to continue editing text notes even while disconnected.

## Open Technical Questions

- Which app framework should be used?
- Which local transcription engine should be used?
- Should transcription be streaming, segment-based, or both?
- How should temporary audio be stored during active transcription?
- What is the crash recovery policy for temporary audio?
- What local database or storage layer should hold notes?
- How should sync discovery, pairing, authentication, and retry behavior work?
- Should the desktop acknowledgement mean "received" or "processed"?
- How should edits to an already-synced note be handled?

## Current Technical Decision

For v1 planning, assume:

- on-phone transcription.
- text-only saved notes.
- text-only desktop sync.
- optional title.
- no required organization metadata.
- no `user_edited` metadata field.
- temporary audio may exist only as working data during recording/transcription.
