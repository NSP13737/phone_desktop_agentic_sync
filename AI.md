While implementing this project, you should Not implement anything from total scratch before consulting with the user. You should instead go look to see if frameworks already exist for this thing, whether it is for design decisions, just for reference, or some tool that you can integrate instead of building it from scratch, or a UI library, something like this, or simply something that the user could extend on top of instead of creating it themselves.

The goal is to create a simple tool for an individual rather than a polished project with its own unique codebase.

Requirements live in the requirements dir. 

If the requirements are not specific enough or are getting too long, maybe it is time to make a new requirements file/sub-file

While implementing, please update `IMPLEMENTATION_PROGRESS.md` so that future agents know what has happened. Be very high level in your writing here, as there may be dozens of agents that write to this file, and it should just allow them to search where necessary instead of having to read every file.


## User Context

The Codex tool process may run as `root`, but repo commands should be run as the `agent` user when practical so generated files and dependency installs remain editable by the normal workspace owner. Prefer:

`runuser -u agent -- <command>`

For commands that need the repo as the working directory, use:

`runuser -u agent -- bash -lc 'cd /home/agent/obsidian_notetaker && <command>'`

## Sandbox Notes

If a normal workspace command fails with:

`bwrap: Can't find source path /home/agent/obsidian_notetaker: Permission denied`

the sandbox wrapper may be failing to mount the workspace. Retry the same read/write command with escalation and explain that the command is still scoped to the repo.

For Git commands under escalation, Git may report dubious ownership. Use a per-command safe directory override instead of changing global config:

`git -c safe.directory=/home/agent/obsidian_notetaker status --short`
`git -c safe.directory=/home/agent/obsidian_notetaker diff -- <paths>`