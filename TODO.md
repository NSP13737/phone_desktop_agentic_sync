# Obsidian Notetaker TODO

## Current Product Direction

Build a simple personal tool for low-friction natural-language capture on a phone, with a desktop companion that performs the smarter Obsidian integration work.

The phone app should be an agnostic capture inbox. The user may use it for journaling, tasks, ideas, reminders, project notes, or anything else, but the product itself should not be framed as a journal app.

The desktop companion should infer where captured notes belong, process them automatically by default, and make the resulting changes clear enough that the user can quickly notice and revert mistakes.

## High-Level Decisions

- The phone app should prioritize fast typed capture over organization.
- The desktop companion should own the smart logic, including interpretation, categorization, Obsidian writing, and Git integration.
- The system should feel transparent and safe: the user should not fear losing notes.
- Sync should be reliable but not attention-seeking. The user should be able to trust that captures are queued locally and eventually handed off.
- Notes that cannot be confidently categorized should go to a separate needs-review area, not to a generic miscellaneous folder.
- A miscellaneous destination should remain available for notes the user intentionally wants stored there.
- The desktop companion should auto-process by default rather than waiting for approval for every note.
- Git integration should provide a rollback path when the desktop agent makes a bad change.

## Open Questions

- Decide how the phone indicates uncertainty or user intent without adding capture friction.
- Decide how much of the desktop companion should be a GUI versus a background service plus status window.
- Decide how Git commits should be grouped: one commit per processed batch, one commit per note, or one commit per agent run.
- Decide how the desktop companion should surface agent actions after auto-processing.
- Decide whether the desktop app should integrate directly with Git, shell out to Git, or interoperate with a user-facing tool like GitHub Desktop.

## Usability Holes To Explore

- Requiring the user to specify the destination during capture may create too much friction. The system should allow natural-language notes first and infer routing later.
- If sync status is unclear, the user may start babysitting it. The UI needs clear states like saved locally, waiting to sync, synced, processed, and needs review.
- If the agent silently changes Obsidian, mistakes may feel invasive. Auto-processing should be paired with clear desktop visibility and Git rollback.
- The difference between "uncategorized because the agent is unsure" and "miscellaneous because the user wanted that" must be explicit.

## Near-Term Planning Tasks

- Define the phone capture flow from app open to saved local item.
- Define the desktop processing flow from synced capture to Obsidian write.
- Sketch the desktop companion interface, especially the processed activity feed, needs-review area, and Git rollback/status surface.
- Research existing frameworks, apps, protocols, and libraries before building anything from scratch.
- Choose a minimal architecture that is useful for one individual before optimizing for a polished public product.
