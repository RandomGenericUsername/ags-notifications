---
id: OPS-001
title: "Align the local dev pin with ags-platform v1.0.1"
kind: ops-task
status: in-progress
lane: direct
links:
  openspec: none
  bmad: none
worktree: .worktrees/OPS-001/
branch: ticket/OPS-001-dev-pin-parity
---

# Align the local dev pin with ags-platform v1.0.1

> `ops-task` read as `chore`. Git discipline applies: clean-main check,
> worktree, ticket branch, gates, fast-forward merge, annotated tag and push.

## Work

Bump the local `ags-platform` pin from `v1.0.0` to `v1.0.1` for dev-pin parity
with the sibling platform checkout. Keep `contracts` at `v0.8.0`.

Update every pin-bearing surface as applicable:

- `Makefile` (`AGS_PLATFORM_VERSION`, comments, help/symlink paths);
- `.github/workflows/ci.yml` (checkout `ref` and path);
- `tests/app-contract.test.mjs` (the pin assertion);
- `README.md`, `AGENTS.md`, `CHANGELOG.md`.

Unchanged surfaces (hard constraints): app code (`app.tsx`, `ui/`, `lib/`),
handler/ack behavior, `style.css`, layout tokens (`layout.ags-notifications.card-width`)
and lane policy. `contracts` stays `v0.8.0`. The local tag `v1.0.1` is the peak;
do not move or retag the platform. No live apply.

Historical `tickets/REQ-005-*` evidence keeps its `v1.0.0` text; it records the
state at that release and is not a live pin.

## Acceptance

- [ ] `Makefile` and `.github/workflows/ci.yml` pin `ags-platform` `v1.0.1`
      and `contracts` `v0.8.0`.
- [ ] `tests/app-contract.test.mjs` asserts the `v1.0.1` pin and rejects the
      old `v1.0.0` pin.
- [ ] `README.md`, `AGENTS.md` and `CHANGELOG.md` name the `v1.0.1` platform
      pin; `contracts` remains `v0.8.0`.
- [ ] No change to app code, handler/ack behavior, `style.css`, layout tokens
      or lane policy.
- [ ] `make gates` passes with the local platform and contracts checkouts.
- [ ] Work is committed on `ticket/OPS-001-dev-pin-parity`, merged
      fast-forward to `main`, tagged with annotated patch release `v0.5.1`,
      and `main` + tag are pushed.

## Done-when

`make gates` passes on the ticket branch with the `v1.0.1` pin, the branch is
merged fast-forward to `main`, annotated `v0.5.1` is created and `main` + tag
are pushed.

## Evidence

Fill in the closeout commit with the executed commands and exact counts.

## Commits

| Commit | Subject |
| --- | --- |
| this commit | `chore(OPS-001): file the dev-pin parity ticket` |

## Status

In progress on `ticket/OPS-001-dev-pin-parity`; worktree `.worktrees/OPS-001/`,
base `354a1d1` (main, `v0.5.0`).
