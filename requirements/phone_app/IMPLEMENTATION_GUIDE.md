# Phone App Implementation Guide

Read this first when implementing phone app work.

This document is the agent entry point for the phone app. It summarizes the v1 structure, names the source-of-truth requirement files, and describes how to approach implementation tasks without rediscovering the requirements folder each time.

## Implementation Posture

The phone app is a simple personal capture tool. Prefer boring, existing frameworks and libraries over custom infrastructure.

Before implementing a task:

1. Read this document.
2. Read the linked subdocument for the area you are changing.
3. Check whether the requirement is already specified.
4. If a behavior is not specified in the requirements, ask the user before deciding it.
5. Keep edits scoped to the current task.
6. Report what changed and what was verified.

## V1 Component Map

The v1 phone app is organized around this pipeline:

```text
Capture UI
  -> Audio Recorder
  -> Temporary Audio Store
  -> Transcription Queue
  -> VAD
  -> Local Whisper-family Transcription
  -> Local Note Store
  -> Sync Queue
  -> Desktop Sync Client
```

The phone owns capture, temporary audio handling, on-device transcription, local text persistence, local editing before sync, sync queueing, and handoff to the desktop companion.

The desktop companion owns Obsidian routing, agentic interpretation, Git commits or rollback, long-term processing, and final placement into the vault.

## Current V1 Decisions

- The app uses React Native with Expo.
- Expo Go is acceptable only for early UI and simple API exploration.
- Expo development builds are expected once native audio or transcription integration begins.
- Transcription runs on the phone.
- The transcription pipeline is queued, local, and VAD-first.
- Whisper-family local transcription is the default direction, with `whisper.cpp` as the leading underlying candidate.
- The first transcription implementation spike should evaluate `whisper.rn` in an Expo development build.
- Audio is temporary working data, not durable user data.
- Temporary audio is deleted after transcript insertion and local note save, after no-speech completion, or after an unrecoverable transcription outcome is recorded.
- Saved captures are text plus minimal metadata.
- SQLite is the v1 storage direction for ordinary app data.
- Secure device storage is the v1 storage direction for pairing secrets and sync tokens.
- Sync sends text and metadata only.
- The MVP includes actual QR-code desktop pairing.
- QR payloads are JSON.
- Future sync uses stored bearer-token-style credentials.
- The desktop acknowledgement marks the phone note as `synced` after the desktop has received and durably accepted the capture.
- Synced notes are read-only on the phone for this iteration.

## MVP Scope

Before building the full MVP, implement the transcription spike first.

The spike should prove the highest-risk native path on a physical device before the rest of the MVP depends on it:

- create an Expo development build.
- record local audio on a physical phone.
- run local VAD-first transcription through `whisper.rn` or the selected wrapper.
- insert the transcript into local app state.
- delete the temporary audio after the transcript is safely available.

Do not build the full MVP UI, storage, or pairing flow around a transcription package until this spike has passed or a replacement transcription path has been chosen and documented.

The MVP should be extensible, but it should include the real core loop rather than mocks only:

- React Native with Expo development build.
- current note capture UI.
- local audio recording on a physical device.
- queued, VAD-first local transcription.
- local text note persistence in SQLite.
- previous notes drawer with sync status.
- actual QR-code pairing with the desktop companion.
- JSON sync handoff over local HTTP using stored bearer-token-style credentials.
- local cleanup of synced notes.

The MVP may defer:

- mDNS/DNS-SD local service discovery.
- cloud relay or account-based sync.
- configurable audio retention.
- post-sync phone edits.
- streaming partial transcripts while recording.

## Reading Order By Task Area

For any phone app task, start with:

- `README.md` for the product role and high-level assumptions.
- `TECHNICAL_FLOW.md` for lifecycle, data flow, sync, storage, and failure handling.
- `HIGH_LEVEL_APP_FLOW.md` for the orientation diagram.

Then read the relevant focused document:

- `APP_FRAMEWORK.md` for React Native, Expo, build modes, and native-module boundaries.
- `TRANSCRIPTION_REQUIREMENTS.md` for VAD, local transcription, transcription queue, and audio retention.
- `PAIRING_REQUIREMENTS.md` for QR pairing, stored trust, desktop discovery, IP address changes, and manual recovery.
- `UI_DESIGN_FLOW.md` for screen flow and user experience details, if present.

If a task crosses multiple areas, read every relevant subdocument before editing.

## Implementation Boundaries

Keep these areas behind small interfaces:

- audio recording service.
- temporary audio file service.
- transcription queue.
- VAD adapter.
- transcription engine adapter.
- local note storage.
- sync queue.
- desktop sync client.
- desktop pairing client.

Do not put audio-file, transcription-engine, storage, or desktop-networking assumptions directly inside UI components.

## Core Runtime Flow

1. User records audio in the current note.
2. Stopping recording creates a transcription job.
3. The app records the intended insertion target for the eventual transcript.
4. The microphone becomes available again immediately.
5. A background worker runs VAD on the temporary audio segment.
6. No-speech segments complete without inserting text.
7. Speech ranges are sent to the local transcription engine.
8. Successful transcript text is inserted into the local note.
9. The note is saved locally.
10. Temporary audio is deleted after successful processing.
11. The note enters or remains in the sync queue.
12. When the desktop companion is reachable, text plus metadata is sent.
13. Desktop acknowledgement marks the phone note as synced.
14. Synced notes become read-only on the phone.

## Data Safety Rules

- Local note text must remain safe even if recording, transcription, or sync fails.
- Failed sync must not hide or delete a note.
- Failed transcription must not block future recordings.
- No-speech segments are normal outcomes, not user-visible errors.
- Delayed transcription must never overwrite manual edits unless the captured insertion target is clearly still valid.
- If an insertion target is unreliable, append the transcript or choose the nearest safe position.
- Delete only notes that are already marked `synced`, and only as a local phone operation.

## Sync And Pairing Direction

Pairing is specified in `PAIRING_REQUIREMENTS.md`.

The current preferred direction is local-first pairing:

- Desktop companion shows a QR code.
- Phone scans the QR code.
- QR payload gives the phone enough information to reach and trust the desktop companion.
- Future sync uses stored pairing credentials.
- Future sync should tolerate desktop IP address changes through last-known address, manual address fallback, or re-pairing for the MVP. Local service discovery is deferred.

## When Requirements Are Missing

If the next implementation task depends on an unspecified decision, do not invent the behavior in code.

Instead:

1. State the missing decision.
2. Offer a small set of options.
3. Ask the user to choose.
4. Update the appropriate requirement document.
5. Then implement.

This keeps the requirements folder as the ground truth for future agents.
