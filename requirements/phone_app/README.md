# Phone App

## Agent Start Here

Agents implementing phone app work should read `IMPLEMENTATION_GUIDE.md` first. It summarizes the v1 component structure, current decisions, implementation boundaries, and the reading order for the deeper requirement documents.

## Role

The phone app is the low-friction typed capture surface. It should let the user jot down text quickly, save the capture safely, and sync it to the desktop companion later.

The phone app should not try to be a full Obsidian client or a heavy agentic tool. It should be simple, fast, and reliable.

## Desired User Experience

- The user opens the app and can immediately start typing into a blank note.
- The user writes in natural language without needing to choose a folder, mode, or schema first.
- The note is editable directly, with no separate capture or review mode.
- Captures are stored locally when the desktop is unavailable.
- The user can review and edit local captures before they sync.
- The app should make it obvious that a capture is safe, even if it has not synced yet.

## Current Assumptions

- The phone app is an agnostic inbox, not specifically a journal app.
- Most organization should happen later on the desktop.
- The phone may support lightweight metadata eventually, but metadata should not be required for ordinary typed capture.
- The app should avoid complex setup and avoid requiring an always-online desktop.
- Pairing with the desktop companion is specified in `PAIRING_REQUIREMENTS.md`.

## Storage Decision

For v1, saved captures are typed text plus minimal metadata. The desktop companion receives text captures only.

## Future Questions

- What should happen if the same capture is edited on phone after it already synced?
  - Current answer: the phone app should not allow editing a capture after it has synced. For this iteration, synced captures are read-only on the phone.
