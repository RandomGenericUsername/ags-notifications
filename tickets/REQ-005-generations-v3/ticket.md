---
id: REQ-005
title: "Migrate notifications to Generations v3 appearance-refresh"
kind: requirement
status: in-progress
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

- [ ] `app.tsx` dispatches `APPEARANCE_REFRESH_COMMAND` from
      `ags-platform/ports/appearance-refresh`; no `PALETTE_REFRESH_COMMAND`
      import or v2 command remains.
- [ ] `createAppearance({ configDir: "ags-notifications" })` and
      `appearance.apply()` are unchanged; the request handler is still
      `createAppearanceRefreshHandler(appearance, work)` with the progress-card
      icon work.
- [ ] The work returns `{ status: "applied" }`; the handler produces an exact
      generation-bound ack and no `{"ok":true}`.
- [ ] No new command or second request handler is added.
- [ ] `style.css`, `layout.ags-notifications.card-width`, the non-destructive
      palette-refresh work and the `wallpaper.state` progress/status
      subscription are unchanged.
- [ ] `Makefile`, CI, README, AGENTS and CHANGELOG pins target `ags-platform`
      `v1.0.0` and `contracts` `v0.8.0`; `templates/ags-app/` is untouched.
- [ ] `make test`, `make conformance`, `make drift` assert v3
      `appearance-refresh` and generation-bound responses.
- [ ] `make gates` passes on the ticket branch with the local platform and
      contracts checkouts.
- [ ] Work is committed on `ticket/REQ-005-generations-v3`, merged
      fast-forward to `main`, tagged with the next minor release, and `main` +
      tag are pushed.

## Evidence

Pending implementation.

## Commits

| Commit | Subject |
| --- | --- |
| this commit | `chore(REQ-005): file the generations v3 ticket` |
| pending | `feat(REQ-005): consume generations v3 appearance-refresh` |
| pending | `docs(REQ-005): record generations v3 evidence` |

## Status

In progress on `ticket/REQ-005-generations-v3`; worktree
`.worktrees/REQ-005/`, base `96fb3b6` (main, `v0.4.0`).
