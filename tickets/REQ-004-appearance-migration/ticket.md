---
id: REQ-004
title: "Migrate notifications to the v2 Appearance plane"
kind: requirement
status: in-progress
lane: 3
links:
  openspec: none
  bmad: none
worktree: .worktrees/REQ-004/
branch: ticket/REQ-004-appearance-migration
---

# Migrate notifications to the v2 Appearance plane

## Requirement

Replace the split v1 `theme.apply()` + `skin.apply()` startup pair in `app.tsx`
with the platform v0.9.0 unified Appearance consumer for contracts v0.7.0. A
module-level `createAppearance({ configDir: "ags-notifications" })` owns the one
`current/appearance` monitor and one composed provider; `main()` calls
`appearance.apply()`.

Replace the v1 palette-refresh wrapper with
`createAppearanceRefreshHandler(appearance, work)`. The platform re-applies the
whole appearance before app-owned work, so `theme.apply()` disappears from the
handler. The preserved work is the existing non-destructive surface: re-resolve
the registry-backed progress-card icons while keeping open wallpaper and
speed-test cards, queued notifications and the AstalNotifd daemon/bus
subscription untouched. There is no new request command.

Read the card width through
`appearance.value("layout.ags-notifications.card-width", 380)` instead of the
`CARD_WIDTH` constant. Keep `style.css` as the bundled fallback; make no
structure, class, gesture, size or behavior changes.

Bump the local/CI pins to `ags-platform` v0.9.0 and `contracts` v0.7.0. The
frozen `templates/ags-app/` scaffold stays untouched.

## Acceptance

- [ ] `app.tsx` imports `createAppearance` and builds a module-level
      `appearance` with `configDir: "ags-notifications"`; `main()` calls
      `appearance.apply()`.
- [ ] `app.tsx` no longer imports or calls `theme.apply()` or `skin.apply()`.
- [ ] The request handler is
      `createAppearanceRefreshHandler(appearance, work)` and the work keeps the
      progress-card icon re-resolution without a `theme.apply()` call.
- [ ] The handler still answers only `PALETTE_REFRESH_COMMAND`; no new request
      command or second request handler is added.
- [ ] The card width comes from
      `appearance.value("layout.ags-notifications.card-width", 380)` instead of
      the `CARD_WIDTH` constant.
- [ ] `style.css` is still present, unmodified as the bundled fallback, and
      still passed to `app.start({ css })`.
- [ ] No structure, class, gesture, size or behavior changes.
- [ ] `Makefile`, CI and the pin tests target `ags-platform` v0.9.0 and
      `contracts` v0.7.0; the frozen `templates/ags-app/` scaffold is untouched.
- [ ] The source-level validation test asserts the Appearance configDir, the
      `main()` apply and the `createAppearanceRefreshHandler` wiring.
- [ ] `make gates` passes on the ticket branch.
- [ ] The work is committed on `ticket/REQ-004-appearance-migration`; the
      branch is merged fast-forward to `main` and tagged with the next minor
      release without pushing.

## Evidence

Filled at closeout.

## Commits

| Commit | Subject |
| --- | --- |
| this commit | `chore(REQ-004): file the v2 appearance migration ticket` |

## Deviations / notes

Filled at closeout.

## Status

In progress on `ticket/REQ-004-appearance-migration`; worktree
`.worktrees/REQ-004/`, base `9517fb5` (main, `v0.3.0`).
