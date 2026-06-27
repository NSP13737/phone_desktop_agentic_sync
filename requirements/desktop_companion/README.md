# Desktop Companion

## Role

The desktop companion receives captures from the phone, interprets them, updates the user's Obsidian vault, and makes every agent action visible enough that mistakes can be noticed and reverted.

This is where the smart logic should live. The phone captures; the desktop processes.

## Desired Behavior

- Receive queued captures from the phone when sync is available.
- Infer the user's intended destination or action from natural-language content.
- Auto-process captures by default.
- Route unclear captures to a needs-review area instead of dumping them into miscellaneous.
- Preserve a deliberate miscellaneous destination for notes the user intentionally wants there.
- Show what the agent changed after processing.
- Integrate with Git so the user has a rollback path.

## Desktop Interface Ideas

The desktop app needs more design work. Important surfaces likely include:

- An inbox or activity feed showing newly received captures.
- A processed feed showing what the agent did to Obsidian.
- A needs-review area for captures the agent could not confidently categorize.
- A Git/status area showing the latest commit, changed files, and rollback guidance.
- A detail view for an individual capture, including original text/transcript, inferred intent, destination, and final Obsidian change.

## Git Integration

The current direction is that the companion should commit after the agent finishes the current local processing tasks. This gives the user a practical way to roll back if the agent makes incorrect edits.

Open questions:

- Should commits happen once per batch, once per note, or once per processing run?
- Should the app call Git directly, use a library, or integrate with a user-facing app like GitHub Desktop?
- Should the app require the Obsidian vault to already be a Git repository?
- How should uncommitted user changes in the vault be handled before the agent writes anything?

## Agent Behavior

The desktop agent should not be thought of as learning personal patterns over time in the first version. Instead, it should use explicit rules, prompts, configuration, and current vault context to process notes.

The default behavior should be automatic processing. Safety should come from:

- clear visibility into what changed,
- separation of uncertain notes into needs-review,
- Git commits for rollback,
- and a UI that makes incorrect routing easy to spot.

## Future Questions

- What exact confidence threshold should send a note to needs-review?
- How should the agent explain why it routed a note somewhere?
- Should the companion support undo inside the app, or rely on Git rollback?
- How should it handle conflicts with existing Obsidian files?
- Should it use Obsidian MCP tools, direct markdown file edits, or another integration path?
