---
id: OPS-003
title: "Align the local dev pin with ags-platform v1.1.0 and contracts v0.12.0"
kind: ops-task
status: in-progress
lane: direct
links:
  openspec: none
  bmad: none
worktree: .worktrees/OPS-003/
branch: ticket/OPS-003-dev-pin-parity-v1.1.0
---

# Align the local dev pin with ags-platform v1.1.0 and contracts v0.12.0

> `ops-task` read as `chore`. Git discipline applies: clean-main check,
> worktree, ticket branch, gates, fast-forward merge, annotated tag and push.

## Work

Bump the local/CI `ags-platform` pin from `v1.0.1` to `v1.1.0` and the
`contracts` pin from `v0.8.0` to `v0.12.0` for dev-pin parity with the sibling
checkouts. This is a patch release (`v0.5.2`).

Update every pin-bearing surface as applicable:

- `Makefile` (`AGS_PLATFORM_VERSION`, `CONTRACTS_VERSION`, comments, help/symlink
  paths);
- `.github/workflows/ci.yml` (checkout `ref`s and platform path);
- `tests/app-contract.test.mjs` (the pin and schema assertions);
- `README.md`, `AGENTS.md`, `CHANGELOG.md`.

Unchanged surfaces (hard constraints): app code (`app.tsx`, `ui/`, `lib/`),
handler/lane behavior, `style.css`, layout tokens
(`layout.ags-notifications.card-width`) and lane policy. Do not move or retag
either dependency. No live apply.

Historical `tickets/REQ-005-*` and `tickets/OPS-001-*` evidence keeps its
`v1.0.0`/`v1.0.1`/`v0.8.0` text; it records the state at those releases and is
not a live pin.

## Acceptance

- [ ] `Makefile` and `.github/workflows/ci.yml` pin `ags-platform` `v1.1.0` and
      `contracts` `v0.12.0`.
- [ ] `tests/app-contract.test.mjs` asserts the `v1.1.0`/`v0.12.0` pins and
      rejects the old `v1.0.1`/`v0.8.0` pins.
- [ ] `README.md`, `AGENTS.md` and `CHANGELOG.md` name the `v1.1.0`/`v0.12.0`
      pins.
- [ ] No change to app code, handler behavior, `style.css`, layout tokens or
      lane policy.
- [ ] `make gates` passes with the local platform and contracts checkouts.
- [ ] Work is committed on `ticket/OPS-003-dev-pin-parity-v1.1.0`, merged
      fast-forward to `main`, tagged with annotated patch release `v0.5.2`, and
      `main` + tag are pushed.

## Done-when

`make gates` passes on the ticket branch with the `v1.1.0`/`v0.12.0` pins, the
branch is merged fast-forward to `main`, annotated `v0.5.2` is created and
`main` + tag are pushed.

## Evidence

Evidence: MISSING — run the gates and record paths, SHAs and outputs here.

## Commits

| Commit | Subject |
| --- | --- |
| this filing commit | `chore(OPS-003): file the dev-pin parity ticket` |

## Deviations / notes

- No live apply.

## Status

In progress on `ticket/OPS-003-dev-pin-parity-v1.1.0`; worktree
`.worktrees/OPS-003/`, base `e75bd55` (main, `v0.5.1`).
