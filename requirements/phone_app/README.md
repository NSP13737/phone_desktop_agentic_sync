# Phone App

## Agent Start Here

Agents implementing phone app work should read `IMPLEMENTATION_GUIDE.md` first. It summarizes the v1 component structure, current decisions, implementation boundaries, and the reading order for the deeper requirement documents.

## Role

The phone app is the low-friction capture surface. It should let the user speak naturally, save the capture safely, and sync it to the desktop companion later.

The phone app should not try to be a full Obsidian client or a heavy agentic tool. It should be simple, fast, and reliable.

## Desired User Experience

- The user opens the app and can immediately start recording.
- The user speaks in natural language without needing to choose a folder, mode, or schema first.
- After recording, the user can optionally keep recording, edit the text/transcript, or save the capture.
- Captures are stored locally when the desktop is unavailable.
- The user can review and edit local captures before they sync.
- The app should make it obvious that a capture is safe, even if it has not synced yet.

## Current Assumptions

- The phone app is an agnostic inbox, not specifically a journal app.
- Most organization should happen later on the desktop.
- The phone may support lightweight metadata eventually, but metadata should not be required for ordinary capture.
- The app should avoid complex setup and avoid requiring an always-online desktop.
- Pairing with the desktop companion is specified in `PAIRING_REQUIREMENTS.md`.

## Audio Storage Decision

For v1, audio is temporary working data, not durable user data.

The phone app records audio locally, queues it for on-device transcription, saves the resulting text note, and then deletes the temporary audio after the transcript has been inserted and the note has been saved. Audio is not synced to the desktop companion.

Temporary audio may remain on the device only while recording, while waiting for transcription, while transcription is running, or while recovering from an interrupted transcription job. If transcription completes with no speech detected, the temporary audio should also be deleted after that outcome is safely recorded.

Saved captures are text plus minimal metadata. The desktop companion receives text captures, not audio files.

## Future Questions

- What should happen if the same capture is edited on phone after it already synced?
  - Current answer: the phone app should not allow editing a capture after it has synced. For this iteration, synced captures are read-only on the phone.
