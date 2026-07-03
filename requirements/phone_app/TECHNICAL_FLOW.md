# Phone App Technical Flow

This document captures the technical flow implied by the phone app diary and UI design. It is intentionally a planning reference, not a final implementation plan.

The current decision is that the phone app transcribes audio locally and persists only text plus minimal metadata. The desktop companion receives text captures, not audio files.

The current app framework decision is **React Native with Expo**. Details live in `APP_FRAMEWORK.md`.

A high-level Mermaid diagram of the app moving pieces lives in `HIGH_LEVEL_APP_FLOW.md`.

Pairing and future desktop discovery requirements live in `PAIRING_REQUIREMENTS.md`.

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
2. When recording stops, the app stores that audio segment as temporary working data and adds it to a local transcription queue.
3. The microphone returns to an available state so the user can record another segment immediately.
4. A local transcription worker processes queued audio segments in the background.
5. As each segment finishes, the transcript is inserted into the correct note position.
6. The app saves the updated text note locally.
7. The app discards that segment's temporary audio after successful transcription insertion and save.
8. The note enters or remains in the sync queue.
9. When the desktop companion is reachable, the phone sends text plus metadata.
10. The desktop companion acknowledges successful receipt.
11. The phone marks the note as synced.
12. The user may delete synced notes from the phone.

## Local Note Lifecycle

Suggested lifecycle states:

- **Draft local**: the current note exists locally and may still be edited.
- **Queued**: the note is saved locally and waiting for desktop handoff.
- **Syncing**: the note is actively being sent to the desktop companion.
- **Synced**: the desktop companion has acknowledged receipt.
- **Sync failed**: the note remains local, but the last handoff attempt failed.

The app should treat all non-deleted notes as locally safe. Failed sync should not imply data loss.

For this iteration, synced notes are read-only on the phone. The app should allow local editing before handoff, but once the desktop companion acknowledges a capture, the phone should not permit further edits to that capture. This avoids conflict-resolution requirements between phone edits and desktop-side processing.

## Recording Session Lifecycle

Recording is separate from note persistence.

Suggested recording states:

- **Idle**: no active recording.
- **Recording**: audio is being captured.
- **Segment queued**: audio has stopped, the segment has been saved as temporary working data, and transcription has been queued.
- **Ready for next recording**: the app is not actively recording, even if one or more earlier segments are still transcribing.

A note may move through this recording lifecycle multiple times. Each recording segment can append text or insert text at the cursor position captured for that segment.

Transcription has its own background segment lifecycle:

- **Queued**: the audio segment is waiting for local transcription.
- **Transcribing**: the local model is producing text for that segment.
- **Transcript inserted**: text has been added to the note.
- **Temporary audio discarded**: the app has removed the transient audio data for that segment.
- **Transcription failed**: the segment remains available for retry or explicit user recovery when the temporary audio still exists; otherwise the job records an unrecoverable failure.

The recording lifecycle must not block on the transcription lifecycle. After the user stops a recording, transcription should begin as soon as practical, but the user should still be able to record additional segments while earlier segments are queued or processing.

## Transcription Queue

The app should maintain a local queue of audio segments waiting for transcription.

Queue requirements:

- Each stopped recording creates one transcription job.
- Each job belongs to a note and stores the intended insertion target for its transcript.
- Jobs should be processed in capture order for a given note unless the app has a stronger reason to reorder them.
- The queue should survive normal app backgrounding.
- The queue may hold temporary audio until the segment is transcribed, inserted, and saved.
- The user should be able to keep recording new segments while queued jobs are pending.
- A slow local model should degrade transcript availability, not recording availability.

Suggested transcription job fields:

- `id`
- `note_id`
- `created_at`
- `audio_temp_uri`
- `status`
- `insertion_target`
- `capture_sequence`
- `model_id`
- `language`
- `error_message`, optional

For v1, process one transcription job at a time. This keeps CPU, battery, and native transcription integration simpler while preserving the important user experience: the microphone becomes available again as soon as a stopped segment has been queued.

If transcription fails and the temporary audio still exists, keep the job available for retry. Failed jobs should not block later recordings.

## Text Insertion Rules

When a transcript segment completes:

- If the segment captured an active cursor position, insert the transcript there.
- If the segment captured a selected text range, replace that selection with the transcript if the range is still valid.
- If the original insertion target is no longer reliable because the user edited the note, append the transcript to the end or insert at the nearest safe position.
- If there is no reliable insertion target, append the transcript to the end.

The app should preserve enough editor state per queued segment to make voice insertion predictable, especially after the user taps into the middle of a note. Because transcription can complete after later edits or recordings, insertion should prefer data safety and understandable ordering over perfect cursor reconstruction.

## Local Persistence

The app should persist the note frequently:

- after transcript insertion.
- after manual edits.
- before switching to a new note.
- before sending a note to the desktop companion.
- when the app backgrounds, when possible.

The saved object should be text-first and small enough to sync cheaply.

For v1, use SQLite for ordinary app data: local notes, sync status, transcription jobs, and non-secret pairing metadata such as last known host and port. Use Expo SQLite or the closest maintained SQLite package that works well with the selected Expo development build.

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
- `transcription_model_id`
- `transcription_language`

## Audio Handling

Audio is working data, not durable user data.

Expected behavior:

- Audio is captured to a temporary location or in-memory buffer.
- Audio may be chunked if the transcription engine benefits from streaming or segment-based processing.
- Audio for each stopped segment may remain temporarily while its transcription job is queued or processing.
- Audio should be deleted after its transcript segment has been inserted and saved.
- Audio should not appear in the sync payload.
- Audio may remain after the app is closed only when needed to recover an unfinished transcription job.

Crash recovery policy:

- Persist transcription jobs and their temporary audio URI before starting transcription.
- On app startup, retry queued or interrupted jobs whose audio file still exists.
- Delete temporary audio after transcript insertion and local note save.
- Delete temporary audio after a completed no-speech outcome.
- If a job is unrecoverable because the audio file is missing or unreadable, mark the job failed and explain that the segment could not be converted.
- Do not keep temporary audio only for archival, review, or desktop sync.

## Transcription

The app should use an on-device model for transcription. Detailed transcription requirements live in `TRANSCRIPTION_REQUIREMENTS.md`.

During initial MVP implementation, build and verify the transcription spike before building the full MVP around the transcription layer. The spike should run in an Expo development build on a physical device and prove that recorded audio can pass through local VAD-first transcription, update local text state, and release temporary audio safely.

Planning requirements:

- It should work without network access.
- It should be fast enough for short voice notes.
- It should support repeated pause/resume recording within one note.
- It should support queued, segment-based transcription so recording can resume before earlier segments finish processing.
- It should use Voice Activity Detection before speech-to-text so long pauses and no-speech segments do not become invented transcript text.
- It should treat no-speech segments as successful empty outcomes, not transcription failures.
- It should provide enough confidence in the transcript that audio retention is not required for v1.
- It should expose failure states that the UI can communicate simply.

For v1 planning, prefer a VAD-first Whisper-family pipeline. `whisper.cpp` with Silero VAD is the leading underlying candidate. Because the app framework is React Native with Expo, the first implementation spike should evaluate `whisper.rn` in an Expo development build as the practical wrapper candidate.

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
- The user should be able to edit unsynced notes, but synced notes should be presented as read-only on the phone for this iteration.

## Open Technical Questions

- Should a future version support post-sync amendments from the phone, and if so, how should those be represented on the desktop?
- Should a future version add streaming partial transcripts while recording?
- Should a future version add local service discovery, or is last-known address plus manual recovery enough?
- Should a future version support configurable audio retention, such as keeping audio for a short review window?

## Current Technical Decision

For v1 planning, assume:

- React Native with Expo as the app framework.
- Expo Go may be used only for early UI/simple API exploration.
- Expo development builds are the expected main development environment once native audio/transcription integration begins.
- production builds should remain possible for Android APK, Google Play, TestFlight, and App Store distribution.
- on-phone transcription.
- a first transcription feasibility spike using `whisper.rn` in an Expo development build.
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
- temporary audio may exist only as working data during recording, transcription, retry, or crash recovery.
- synced notes are read-only on the phone.
