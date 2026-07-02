# Phone App

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

## Audio Storage Question

This is a major unresolved design choice.

Options to explore:

- Store and sync audio files.
- Store audio temporarily, transcribe on phone, then sync only text.
- Store only text/transcripts and discard audio quickly.
- Let the user configure retention, such as keep audio for 24 hours or until desktop confirms processing.

Tradeoffs:

- Keeping audio preserves nuance and allows re-transcription if the first transcript is wrong.
- Keeping audio increases local storage, file count, sync time, desktop processing complexity, and privacy exposure.
- Sending only text makes syncing simpler but may lose information if transcription is poor.

## Future Questions

- How should the phone pair with the desktop companion?
- What should happen if the same capture is edited on phone after it already synced?
  - Current answer: the phone app should not allow editing a capture after it has synced. For this iteration, synced captures are read-only on the phone.
