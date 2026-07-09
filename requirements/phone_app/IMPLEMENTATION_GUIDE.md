# Phone App Implementation Guide

Read this first when implementing phone app work.

This document is the agent entry point for the phone app. It summarizes the v1 structure, names the source-of-truth requirement files, and describes how to approach implementation tasks without rediscovering the requirements folder each time.

## Implementation Posture

The phone app is a simple personal typed capture tool. Prefer boring, existing frameworks and libraries over custom infrastructure.

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
Typed Note UI
  -> Local Note Store
  -> Sync Queue
  -> Desktop Sync Client
```

The phone owns typed capture, local text persistence, local editing before sync, sync queueing, and handoff to the desktop companion.

The desktop companion owns Obsidian routing, agentic interpretation, Git commits or rollback, long-term processing, and final placement into the vault.

## Current V1 Decisions

- The app uses React Native with Expo.
- Expo Go is acceptable for early UI and simple API exploration.
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

The MVP should include the real core loop:

- React Native with Expo.
- current note typed capture UI.
- local text note persistence in SQLite.
- previous notes drawer with sync status.
- actual QR-code pairing with the desktop companion.
- JSON sync handoff over local HTTP using stored bearer-token-style credentials.
- local cleanup of synced notes.

The MVP may defer:

- mDNS/DNS-SD local service discovery.
- cloud relay or account-based sync.
- post-sync phone edits.
- rich formatting or markdown-specific editing controls.

## Reading Order By Task Area

For any phone app task, start with:

- `README.md` for the product role and high-level assumptions.
- `TECHNICAL_FLOW.md` for lifecycle, data flow, sync, storage, and failure handling.
- `HIGH_LEVEL_APP_FLOW.md` for the orientation diagram.

Then read the relevant focused document:

- `APP_FRAMEWORK.md` for React Native, Expo, build modes, and native-module boundaries.
- `PAIRING_REQUIREMENTS.md` for QR pairing, stored trust, desktop discovery, IP address changes, and manual recovery.
- `UI_DESIGN_FLOW.md` for screen flow and user experience details, if present.

If a task crosses multiple areas, read every relevant subdocument before editing.

## Implementation Boundaries

Keep these areas behind small interfaces:

- local note storage.
- sync queue.
- desktop sync client.
- desktop pairing client.

Do not put storage or desktop-networking assumptions directly inside UI components.

## Core Runtime Flow

1. User types or edits the current note.
2. The note is saved locally.
3. The note enters or remains in the sync queue.
4. When the desktop companion is reachable, text plus metadata is sent.
5. Desktop acknowledgement marks the phone note as synced.
6. Synced notes become read-only on the phone.

## Data Safety Rules

- Local note text must remain safe even if local save or sync fails.
- Failed sync must not hide or delete a note.
- Unsynced notes remain editable.
- Synced notes are read-only on the phone for this iteration.
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
