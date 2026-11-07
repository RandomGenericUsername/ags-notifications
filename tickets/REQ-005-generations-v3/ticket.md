---
id: REQ-005
title: "Migrate notifications to Generations v3 appearance-refresh"
kind: requirement
status: done
lane: 3
links:
  openspec: none
  bmad: none
worktree: .worktrees/REQ-005/
branch: ticket/REQ-005-generations-v3
---

# Migrate notifications to Generations v3 appearance-refresh

## Requirement

Migrate `ags-notifications` to the Generations v3 consumer contract (contracts
`v0.8.0`, platform `v1.0.0`). The runtime now sends exactly
`["appearance-refresh", "<genHash>"]` and accepts only an ack naming that exact
generation; the v2 `palette-refresh` request and `{"ok":true}` response are
invalid.

Keep the existing consumption shape unchanged:

- `createAppearance({ configDir: "ags-notifications" })` at module scope and
  `appearance.apply()` in `main()`;
- `createAppearanceRefreshHandler(appearance, work)` for the request handler,
  with the app-owned work still being `refreshNotificationCardIcons()`;
- no new commands and no second request handler.

The v3 work result must say `{ status: "applied" }` so the platform can answer
`{"applied":"<genHash>"}`; a bare `void` return is an invalid v3 work result.
The app must dispatch `APPEARANCE_REFRESH_COMMAND` instead of
`PALETTE_REFRESH_COMMAND`.

Unchanged surfaces: `style.css` as the bundled fallback, the
`layout.ags-notifications.card-width` token, the palette-refresh work (open
wallpaper/speed-test progress cards, queued notifications and the AstalNotifd
daemon/bus subscription survive), and the `wallpaper.state` subscription as
progress/status only.

Bump the local/CI pins to `ags-platform` `v1.0.0` and `contracts` `v0.8.0`, and
update the source tests that asserted `palette-refresh` / `{"ok":true}` to the
v3 `appearance-refresh` / generation-bound responses. The frozen
`templates/ags-app/` scaffold stays untouched.

## Acceptance

- [x] `app.tsx` dispatches `APPEARANCE_REFRESH_COMMAND` from
      `ags-platform/ports/appearance-refresh`; no `PALETTE_REFRESH_COMMAND`
      import or v2 command remains.
- [x] `createAppearance({ configDir: "ags-notifications" })` and
      `appearance.apply()` are unchanged; the request handler is still
      `createAppearanceRefreshHandler(appearance, work)` with the progress-card
      icon work.
- [x] The work returns `{ status: "applied" }`; the handler produces an exact
      generation-bound ack and no `{"ok":true}`.
- [x] No new command or second request handler is added.
- [x] `style.css`, `layout.ags-notifications.card-width`, the non-destructive
      palette-refresh work and the `wallpaper.state` progress/status
      subscription are unchanged.
- [x] `Makefile`, CI, README, AGENTS and CHANGELOG pins target `ags-platform`
      `v1.0.0` and `contracts` `v0.8.0`; `templates/ags-app/` is untouched.
- [x] `make test`, `make conformance`, `make drift` assert v3
      `appearance-refresh` and generation-bound responses.
- [x] `make gates` passes on the ticket branch with the local platform and
      contracts checkouts.
- [x] Work is committed on `ticket/REQ-005-generations-v3`, merged
      fast-forward to `main`, tagged with the next minor release, and `main` +
      tag are pushed.

## Evidence

- `app.tsx:10-14` imports `createAppearance` and
  `{ APPEARANCE_REFRESH_COMMAND, createAppearanceRefreshHandler }` from
  `ags-platform/ports/appearance-refresh`.
- `app.tsx:61` is the unchanged module-level
  `const appearance = createAppearance({ configDir: "ags-notifications" })`;
  `app.tsx:116` calls `appearance.apply()` in `main()`.
- `app.tsx:71-74` is
  `createAppearanceRefreshHandler(appearance, () => { refreshNotificationCardIcons(); return { status: "applied" } })`.
  The work contains no `theme.apply()` or `skin.apply()`.
- `app.tsx:104-106` dispatches `APPEARANCE_REFRESH_COMMAND` to the platform
  handler before the unknown-request response; the app still has exactly one
  `requestHandler`.
- `app.tsx:80` still reads
  `appearance.value("layout.ags-notifications.card-width", 380)`.
- `git diff 96fb3b6 -- style.css ui/NotificationsWindow.tsx` prints nothing:
  `style.css`, the card icons and the `wallpaper.state` subscription are
  unchanged.
- `Makefile:8-9` pins `AGS_PLATFORM_VERSION := v1.0.0` and
  `CONTRACTS_VERSION := v0.8.0`; `.github/workflows/ci.yml:25-30` checks out
  the same refs.
- `tests/unit.test.mjs:42-186` executes the platform v3 helper: app work after
  the requested generation, idempotence by generation hash, an exact
  `{"applied":"<genHash>"}` response, retryable failure, deferred forwarding,
  rejection of `palette-refresh`, and rejection of `{"ok":true}` and `void`
  work results.
- `tests/app-contract.test.mjs:268-348` asserts the `v1.0.0`/`v0.8.0` pins, the
  v3 command dispatch, the applied work result, the unchanged style/card-width
  surfaces and the absence of theme/skin application.
- `tests/event-contract-drift.mjs:277-320` asserts the v3 handler, the
  generation-bound applied work and the absence of the v2 command/ack.
- `make gates` with
  `AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform` and
  `CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts` → exit 0:
  - `make test` — 19/19 pass (9 v3 handler tests + 10 card-model tests);
  - `make conformance` — 16/16 pass;
  - `make drift` — all checks passed;
  - `make bundle` — `build/ags-notifications.js` 1000028 bytes;
  - `make typecheck` — 0 errors in the `ags-notifications` tree (27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors).
- Local tuple: `ags-platform` checkout at annotated tag `v1.0.0`
  (`ca85672048ebddb278ea55d1e01b391ad3a6d780`) and `contracts` at annotated
  tag `v0.8.0` (`8906f1ad95e10d649ff67d5f7be9dd662eb65fec`).
- `git diff 96fb3b6 -- templates` prints nothing: the frozen
  `templates/ags-app/` scaffold is untouched.

Verify:

```sh
cd .worktrees/REQ-005
rg -n 'createAppearance|APPEARANCE_REFRESH_COMMAND|createAppearanceRefreshHandler|appearance\.apply|status: "applied"' app.tsx
rg -n 'v1\.0\.0|v0\.8\.0' Makefile .github/workflows/ci.yml
make gates \
  AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform \
  CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts
```

## Commits

| Commit | Subject |
| --- | --- |
| `b40521f` | `chore(REQ-005): file the generations v3 ticket` |
| `076c11b` | `feat(REQ-005): consume generations v3 appearance-refresh` |
| this closeout commit | `docs(REQ-005): record generations v3 evidence` |

## Deviations / notes

- The app-owned work now returns `{ status: "applied" }`; under the v3 helper a
  bare `void` return is an invalid work result. The work itself (re-resolve the
  registry-backed progress-card icons) is unchanged.
- The module-level handler binding was renamed from `paletteRefresh` to
  `appearanceRefresh` to match the v3 command. No new command or handler was
  added.
- Gate overrides point at the sibling `ags-platform` (`v1.0.0`) and `contracts`
  (`v0.8.0`) checkouts because `.dev/` is gitignored and a new worktree has no
  symlinks. No recipe or pin is changed by the overrides.
- `templates/ags-app/` remains the frozen scaffold and was not modified.
- No visual/behavior change was made, so no new live screenshot was needed; the
  unchanged `style.css` and the source-level gates cover this consumption
  change.
- The fast-forward merge and annotated `v0.5.0` tag happen after this closeout
  commit; `main` and the tag are pushed.

## Status

Complete on `ticket/REQ-005-generations-v3`; worktree
`.worktrees/REQ-005/`, base `96fb3b6` (main, `v0.4.0`). The closeout commit is
tagged `v0.5.0` and the branch is merged fast-forward to `main`; `main` and the
tag are pushed. No other repository was modified.
