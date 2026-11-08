---
id: OPS-001
title: "Align the local dev pin with ags-platform v1.0.1"
kind: ops-task
status: done
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

- [x] `Makefile` and `.github/workflows/ci.yml` pin `ags-platform` `v1.0.1`
      and `contracts` `v0.8.0`.
- [x] `tests/app-contract.test.mjs` asserts the `v1.0.1` pin and rejects the
      old `v1.0.0` pin.
- [x] `README.md`, `AGENTS.md` and `CHANGELOG.md` name the `v1.0.1` platform
      pin; `contracts` remains `v0.8.0`.
- [x] No change to app code, handler/ack behavior, `style.css`, layout tokens
      or lane policy.
- [x] `make gates` passes with the local platform and contracts checkouts.
- [x] Work is committed on `ticket/OPS-001-dev-pin-parity`, merged
      fast-forward to `main`, tagged with annotated patch release `v0.5.1`,
      and `main` + tag are pushed.

## Done-when

`make gates` passes on the ticket branch with the `v1.0.1` pin, the branch is
merged fast-forward to `main`, annotated `v0.5.1` is created and `main` + tag
are pushed.

## Evidence

- `Makefile:4` names the `v1.0.1` Generations v3 consumer; `Makefile:8` is
  `AGS_PLATFORM_VERSION := v1.0.1`; `Makefile:9` keeps
  `CONTRACTS_VERSION := v0.8.0`; `Makefile:26-27` names the
  `.dev/ags-platform/v1.0.1` symlink path.
- `.github/workflows/ci.yml:25-26` checks out `ref: v1.0.1` at
  `.dev/ags-platform/v1.0.1`; the contracts checkout keeps `ref: v0.8.0`.
- `tests/app-contract.test.mjs:268-280` asserts the `v1.0.1`/`v0.8.0` pins and
  rejects the old `v1.0.0` pin in both the Makefile and CI.
- `README.md:75,81`, `AGENTS.md:66,79` and the new `CHANGELOG.md:3-7` section
  name the `v1.0.1` pin; `contracts` remains `v0.8.0`.
- `git diff 354a1d1 -- app.tsx ui lib style.css` prints nothing: app code,
  handler/ack behavior, `style.css` and layout tokens are unchanged.
- Local platform: annotated tag `v1.0.1` →
  `10b4d11cc4cc38cb68ebda7a849023206ad8b801`; it is the peak local tag
  (`v1.0.0`, `v1.0.1`). Local contracts: annotated tag `v0.8.0` →
  `8906f1ad95e10d649ff67d5f7be9dd662eb65fec`.
- `make gates` with
  `AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform` and
  `CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts` → exit 0:
  - `make test` — 19/19 pass;
  - `make conformance` — 16/16 pass;
  - `make drift` — 60/60 checks pass (`all checks passed`);
  - `make bundle` — `build/ags-notifications.js` 1003100 bytes;
  - `make typecheck` — 0 errors in the `ags-notifications` tree, 27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors.

Verify:

```sh
cd .worktrees/OPS-001
rg -n 'v1\.0\.1|v0\.8\.0' Makefile .github/workflows/ci.yml README.md AGENTS.md CHANGELOG.md
make gates \
  AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform \
  CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts
```

## Commits

| Commit | Subject |
| --- | --- |
| `b36e3df` | `chore(OPS-001): file the dev-pin parity ticket` |
| `bb29b76` | `chore(OPS-001): pin ags-platform v1.0.1` |
| this closeout commit | `docs(OPS-001): record dev-pin parity evidence` |

## Deviations / notes

- `app.tsx:7` still says “platform v1.0.0 consumer”; app code was explicitly
  out of scope and that line is a descriptive comment, not a pin. No app
  behavior, handler/ack, `style.css` or layout token changed.
- Historical `tickets/REQ-005-*` evidence keeps its `v1.0.0` references; those
  record the release state and are not live pins.
- Gates ran in a fresh worktree, so `make gates` generated gitignored
  `node_modules/`, `@girs/` and bundle output. Nothing generated was committed.
- `contracts` was not bumped: it stays `v0.8.0` (annotated
  `8906f1ad95e10d649ff67d5f7be9dd662eb65fec`).
- Release convention is tag-only (no GitHub Releases): `gh release list`
  returns nothing for the repo and previous releases are annotated tags with
  no release object.
- No live apply was performed.

## Status

Complete on `ticket/OPS-001-dev-pin-parity`; worktree `.worktrees/OPS-001/`,
base `354a1d1` (main, `v0.5.0`). The closeout commit is tagged `v0.5.1` and the
branch is merged fast-forward to `main`; `main` and the tag are pushed. No
other repository was modified.
