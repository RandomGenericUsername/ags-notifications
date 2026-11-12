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

- [x] `Makefile` and `.github/workflows/ci.yml` pin `ags-platform` `v1.1.0` and
      `contracts` `v0.12.0`.
- [x] `tests/app-contract.test.mjs` asserts the `v1.1.0`/`v0.12.0` pins and
      rejects the old `v1.0.1`/`v0.8.0` pins.
- [x] `README.md`, `AGENTS.md` and `CHANGELOG.md` name the `v1.1.0`/`v0.12.0`
      pins.
- [x] No change to app code, handler behavior, `style.css`, layout tokens or
      lane policy.
- [x] `make gates` passes with the local platform and contracts checkouts.
- [x] Work is committed on `ticket/OPS-003-dev-pin-parity-v1.1.0`, merged
      fast-forward to `main`, tagged with annotated patch release `v0.5.2`, and
      `main` + tag are pushed.

## Done-when

`make gates` passes on the ticket branch with the `v1.1.0`/`v0.12.0` pins, the
branch is merged fast-forward to `main`, annotated `v0.5.2` is created and
`main` + tag are pushed.

## Evidence

- `Makefile:4-9` names and pins `AGS_PLATFORM_VERSION := v1.1.0` and
  `CONTRACTS_VERSION := v0.12.0`; `Makefile:26-27` names the
  `.dev/ags-platform/v1.1.0` symlink path; `Makefile:104` names the
  contracts `v0.12.0` drift checkout.
- `.github/workflows/ci.yml:25-26` checks out `ref: v1.1.0` at
  `.dev/ags-platform/v1.1.0`; `.github/workflows/ci.yml:30` checks out
  `ref: v0.12.0` at `contracts`.
- `tests/app-contract.test.mjs:249` names the contracts `v0.12.0` schema;
  `tests/app-contract.test.mjs:268-280` asserts the `v1.1.0`/`v0.12.0` pins and
  rejects the old `v1.0.1`/`v0.8.0` pins in the Makefile and CI.
- `README.md:75,81`, `AGENTS.md:66,79` and `CHANGELOG.md:3-7` name the
  `v1.1.0`/`v0.12.0` pins.
- `git diff e75bd55 -- app.tsx ui lib style.css` prints nothing: app code,
  handler/ack behavior, `style.css` and layout tokens are unchanged.
- Local platform: annotated tag `v1.1.0` →
  `f20a68539ae4211604f253b7a54caefa81920262`. Local contracts: annotated tag
  `v0.12.0` → `a03b5632828df8012c02a6117c3be438eca4264b`.
- `make gates` with
  `AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform` and
  `CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts` → exit 0:
  - `make test` — 19/19 pass;
  - `make conformance` — 16/16 pass;
  - `make drift` — all checks pass (`all checks passed`);
  - `make bundle` — `build/ags-notifications.js` 1006100 bytes;
  - `make typecheck` — 0 errors in the `ags-notifications` tree, 27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors.

Verify:

```sh
cd .worktrees/OPS-003
rg -n 'v1\.1\.0|v0\.12\.0' Makefile .github/workflows/ci.yml README.md AGENTS.md CHANGELOG.md tests/app-contract.test.mjs
make gates \
  AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform \
  CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts
```

## Commits

| Commit | Subject |
| --- | --- |
| `3db2702` | `chore(OPS-003): file the dev-pin parity ticket` |
| `d09bf4d` | `chore(OPS-003): pin ags-platform v1.1.0 and contracts v0.12.0` |
| this closeout commit | `docs(OPS-003): record dev-pin parity evidence` |

## Deviations / notes

- `app.tsx:8` still says “(contracts v0.8.0)”; app code was explicitly out of
  scope and that line is a descriptive comment, not a pin. No app behavior,
  handler/ack, `style.css` or layout token changed.
- Historical `tickets/REQ-005-*` and `tickets/OPS-001-*` evidence keeps its
  `v1.0.0`/`v1.0.1`/`v0.8.0` references; those record release state and are not
  live pins.
- Gates ran in a fresh worktree, so `make gates` generated gitignored
  `node_modules/`, `@girs/` and bundle output. Nothing generated was committed.
- Release convention is tag-only (no GitHub Releases): previous releases are
  annotated tags with no release object.
- No live apply was performed.

## Status

Complete on `ticket/OPS-003-dev-pin-parity-v1.1.0`; worktree
`.worktrees/OPS-003/`, base `e75bd55` (main, `v0.5.1`). The closeout commit is
tagged `v0.5.2` and the branch is merged fast-forward to `main`; `main` and the
tag are pushed. No other repository was modified.
