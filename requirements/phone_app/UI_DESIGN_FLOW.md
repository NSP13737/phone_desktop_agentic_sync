# Phone App UI Design Flow

This document describes the intended user-facing flow for the phone app, based on `phone_user_diary01.md`.

The phone app is a fast voice capture surface. It should always open into a note-taking state, not a dashboard, inbox, or project picker. The user should feel like they can start speaking immediately, stop when interrupted, resume later, edit the transcript, and trust that the note is locally safe until it syncs.

## Core UI Model

The app has three primary surfaces:

- **Current note screen**: the default screen and practical "home" of the app.
- **Previous notes drawer**: a bottom drawer that can be swiped up to review and reopen local notes.
- **Settings screen**: a simple status and configuration area, with desktop companion connection status presented prominently.

The current note screen should appear even when the user has no active note yet. A blank new note is the app's resting state.

## Current Note Screen

The current note screen is where capture, transcription, editing, and continuation happen.

Expected elements:

- A top bar with:
  - a **new note** button.
  - a **settings** button.
  - a quiet sync indicator when relevant.
- A main text area containing the current transcript.
- A large microphone button near the bottom of the screen.
- A bottom gesture area for opening the previous notes drawer.

The microphone button has one primary meaning: toggle recording for the current note. The user should not have to choose a mode before recording.

## Opening The App

When the app opens:

1. The user lands directly on the current note screen.
2. If there is no active note, the screen shows an empty new note.
3. The large microphone button is immediately available.
4. The user can begin recording without choosing a folder, title, tag, or destination.

There should not be a separate home screen. Returning to the app should feel like returning to a ready capture surface.

## Recording And Pausing

The user starts recording by tapping the large microphone button.

While recording:

- The app records temporary audio.
- The local transcription model produces text for the note.
- The visible transcript updates as transcription becomes available.
- The user can stop recording by tapping the microphone button again.

When recording stops:

- The transcript remains visible.
- The user can read what has been captured so far.
- The user can resume by tapping the microphone button again.
- Resumed speech appends to the current note unless the cursor indicates an insertion point.

This supports interruption as a normal part of capture. The user should be able to stop, talk to someone, look back at the transcript, remember where they were, and continue.

## Editing The Transcript

After recording, the transcript is editable directly on the current note screen.

The user can:

- tap into the transcript.
- edit text manually.
- place the cursor in the middle of existing text.
- tap the microphone button to insert a newly transcribed voice segment at that cursor location.

Voice insertion should respect the user's text cursor. If there is no explicit cursor placement, new transcription appends to the end of the note.

## Auto-Save Behavior

The current note should auto-save locally as the user records, pauses, edits, and switches away.

Important expectations:

- The user should not need to press a save button.
- Starting a new note should preserve the previous note automatically.
- Closing the app should not lose the active note.
- Reopening the app should present a new ready note screen, while previous notes remain available in the drawer.

The UI should make local safety obvious without demanding attention. A subtle saved-local state is enough.

## Starting A New Note

The new note button sits in the top bar.

When tapped:

1. The current note is auto-saved locally.
2. A blank note becomes the current note.
3. The user can immediately begin recording another thought.

The new note button should not require a title or metadata prompt.

## Previous Notes Drawer

The user opens previous notes by swiping up from the bottom of the current note screen.

Design requirements:

- The gesture should avoid conflicting with the phone's system home gesture.
- The drawer shows local notes in a compact list.
- Each note preview shows the first few words of the note.
- Each note shows its sync status.
- Tapping a note opens it on the current note screen for review or editing.

The drawer is not a full file browser. It is a lightweight way to recover, edit, and check recent captures.

## Optional Titles

Notes may have optional user-entered titles.

Title behavior:

- Titles are not required.
- Titles are not automatically generated in the phone app.
- A user can add or edit a title after opening a previous note.
- Untitled notes should remain valid and syncable.

The phone app should not pressure the user to name captures before saving or syncing.

## Settings And Desktop Connection

The settings button opens an app settings screen.

The desktop companion connection status should be foregrounded on this screen. It should be easy for the user to answer: "Is my phone connected to the desktop companion right now?"

Connection states may include:

- disconnected.
- searching or waiting.
- connected.
- syncing.
- sync error.

When the app becomes connected, the main note screen can show a green sync indicator in the top bar while syncing is active or recently completed.

## Sync Status In The Drawer

Each previous note should show its sync status.

Useful statuses:

- **Local only**: saved on the phone, not currently syncing.
- **Syncing**: being sent to the desktop companion.
- **Synced**: successfully handed off to the desktop companion.
- **Sync failed**: still saved locally, but the last sync attempt failed.

The user should be able to trust that unsynced notes are safe locally.

## Delete All Synced Notes

The previous notes drawer includes a persistent **delete all synced notes** action.

Behavior:

- The action only deletes notes that have successfully synced.
- Local-only, syncing, and failed notes remain on the phone.
- The app should confirm before deleting multiple notes.
- After deletion, the drawer should make clear if unsynced notes remain.

This gives the user a simple cleanup path without risking unsynced captures.

## Audio Retention Policy

The phone app uses temporary audio only as an input to local transcription.

Policy:

- Audio may exist while recording and while transcription is completing.
- Saved captures contain text and minimal metadata only.
- Audio is discarded after the transcript has been produced and the note is saved.
- Audio is not synced to the desktop companion.

The persisted phone app object is a text note, not an audio recording.

## Minimal Saved Note Shape

The UI assumes each local note has:

- `id`
- `created_at`
- `updated_at`
- `title`, optional
- `text`
- `source`, such as `voice`
- `sync_status`
- `transcription_model_id`, optional but useful for debugging
- `transcription_language`, optional

The app does not need a `user_edited` metadata field.

## Primary Flow Summary

1. Open app.
2. Land directly in a blank current note.
3. Tap microphone to record.
4. Tap microphone again to stop when interrupted.
5. Read visible transcript.
6. Tap microphone again to continue.
7. Edit transcript text directly.
8. Place cursor in the middle of text and record an inserted voice segment.
9. Tap new note.
10. Previous note auto-saves.
11. Record another note.
12. Close app.
13. Reopen app into a blank current note.
14. Swipe up to open previous notes drawer.
15. Open an older note.
16. Optionally add a title.
17. Return to a new note.
18. Open settings to check desktop connection.
19. See sync status in the top bar and drawer.
20. Delete all synced notes when handoff is complete.

## Design Principles

- Open straight into capture.
- Keep recording resumable.
- Treat interruption as normal.
- Make transcript editing direct.
- Keep titles optional.
- Save locally without ceremony.
- Sync quietly but visibly.
- Delete only what is already safely handed off.
