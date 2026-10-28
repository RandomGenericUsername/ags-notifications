---
id: REQ-001
title: "Extract the notifications stack into the standalone ags-notifications repo"
kind: requirement
status: done
lane: 3
links:
  openspec: none
  bmad: none
worktree: none
branch: main
---

# Extract the notifications stack into the standalone ags-notifications repo

## Requirement

Create `ags-notifications` from the `ags-apps` v0.5.0 `notifications/` app, with
the repo root as the app package. Copy the real v0.5.0 palette-refresh handler
(Theme pointer + registry-backed progress-card icons) behind the platform
v0.3.0 protocol helper, preserving the open progress cards and the AstalNotifd
daemon/bus subscription. Ship the standalone dev flow, the frozen
`templates/ags-app/`, the app tests and the event-contract drift gate. This
does not provision, cut over or push.

## Acceptance

- [x] `app.tsx` is at the repo root; there is no app subdirectory.
- [x] Identity is `app/instance=notifications`, `configDir=ags-notifications`,
      `mode=live`, `holdsUnsavedState=false`, window `notifications-window`,
      launcher `notifications-ui`, keybind description “Open notifications”.
- [x] `app.manifest.json` is schema-valid and agrees with `app.tsx`.
- [x] The real v0.5.0 refresh is preserved: re-apply the Theme pointer, then
      re-resolve progress-card icons; open progress cards and the daemon/bus
      subscription survive (no rebuild, dismissal or restart).
- [x] Idempotent by appearance hash; exactly one JSON-string response; a throw
      is reported as a retryable failure.
- [x] `wallpaper.state` / `speedtest.state` remain progress-only; the palette is
      never applied from an event.
- [x] `AGENTS.md`, `tickets/LIFECYCLE|INDEX|_template`, worktree guard,
      Makefile, CI, README, tests and `templates/ags-app/` are present and the
      platform template-conformance gate passes.
- [x] Local gates pass: `make test`, `make conformance`, `make drift`,
      `make typecheck`, `make bundle`.
- [x] Annotated tag `v0.1.0` is created after the gates pass; nothing is pushed.

## Evidence

- Source provenance: `ags-apps` tag `v0.5.0` = `5379a368c929712d0903bd54af7b2cc92b5d2c20`.
  Extracted `app.tsx`, `lib/card-model.ts`, `style.css`,
  `ui/NotificationsWindow.tsx` and the app tests; the only app-source deltas are
  the standalone handler wrapper and the two new pure modules.
- `make gates` → exit 0:
  - `make test` → 17/17 pass (`tests/unit.test.mjs` + `tests/card-model.test.ts`);
  - `make conformance` → 13/13 pass (`tests/app-contract.test.mjs`), including
    the platform `checkAppRepo` template gate;
  - `make drift` → all checks passed (`tests/event-contract-drift.mjs`);
  - `make bundle` → `build/ags-notifications.js`, 796288 bytes;
  - `make typecheck` → 0 errors in the ags-notifications tree (27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors).
- Real refresh evidence: `app.tsx` registers
  `createNotificationsPaletteRefresh(() => { theme.apply();
  refreshNotificationCardIcons() })` — the same two steps as v0.5.0.
  `lib/appearance.ts` orders theme → icons and contains no dismissal/rebuild;
  `ui/NotificationsWindow.tsx#refreshNotificationCardIcons` only calls the
  window's icon refresher, which only re-reads icon files. `tests/unit.test.mjs`
  executes the same handler and proves one JSON-string response, same-hash
  no-op and retryable failure. `tests/app-contract.test.mjs` asserts the
  progress-card and daemon/bus invariants; `make drift` asserts the daemon host,
  both subscriptions and the absence of `theme.apply` in the window.
- Template evidence: a throwaway copy of `templates/ags-app/` with every
  `template.json` token replaced passed `make test` (2/2) and
  `make conformance` (2/2) against the local v0.3.0 tuple.
- Local tuple evidence: `.dev/ags-platform/v0.3.0 -> ../../../ags-platform`
  (`ags-platform` v0.3.0 = `dcb04b5c0f47e986c95a56bf32c17d527df406a7`) and
  `.dev/contracts -> ../../contracts` (`contracts` v0.3.0 =
  `c8251657ff1f755d1904595c79b556631bf43f97`); both are gitignored.
- Scope: no push, no GUI/host changes, and no edits to `ags-apps`,
  `ags-platform`, `contracts` or any sibling repo.

## Dependencies

- `ags-apps` v0.5.0 source (`notifications/` at tag `v0.5.0`).
- `ags-platform` v0.3.0 and `contracts` v0.3.0 (local-only tags).
- `ags-clipboard/templates/ags-app/` (frozen template, AD-33).
