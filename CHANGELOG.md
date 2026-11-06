# Changelog

## Unreleased — v0.2.1

- Notification cards are opaque (`background-color: @surface`) instead of
  `alpha(@surface, 0.92)`. Notifications overlay arbitrary app windows, so the
  8% transparency let the window text bleed through the card (live screenshot:
  chat text over the wallpaper-completion toast). Regression test added.

## Unreleased

- Migrate `style.css` from the legacy `@color_*` projection to the
  `palette.v1` semantic roles (`@surface`, `@on_surface`, `@primary`,
  `@error`, `@error_container`). Geometry, selectors and alpha values are
  unchanged.
- Migrate to the v2 appearance plane: `app.tsx` builds one module-level
  `createAppearance({ configDir: "ags-notifications" })`, `main()` calls
  `appearance.apply()`, and `palette-refresh` uses
  `createAppearanceRefreshHandler(appearance, work)`. `style.css` remains the
  bundled glass fallback; the app-owned work is still the progress-card icon
  re-resolution, with no new request command.
- Read the card width from `layout.ags-notifications.card-width` (fallback
  `380`) through `appearance.value()` instead of the `CARD_WIDTH` constant.
- Pin `ags-platform` `v0.9.0` (the unified Appearance consumer) and
  `contracts` `v0.7.0` (the appearance plane v2).

## v0.1.0 — 2026-10-27

- Extract the notification daemon and card stack from `ags-apps` v0.5.0 into
  the standalone `ags-notifications` repo (repo root is the app package).
- Identity: app/instance `notifications`, config dir `ags-notifications`,
  window `notifications-window`, launcher `notifications-ui`, keybind
  description “Open notifications”.
- Preserve the real v0.5.0 `palette-refresh` work behind the platform v0.3.0
  handler: re-apply the Theme pointer and re-resolve progress-card icons;
  idempotent by appearance hash; one JSON-string response.
- Preserve the open wallpaper/speed-test progress cards and the AstalNotifd
  daemon/bus subscription on refresh; no rebuild, dismissal or restart.
- Add the standalone dev flow (`AGENTS.md`, tickets, worktree guard, Makefile,
  CI, tests, `templates/ags-app/`) and the manifest/handler conformance gate.
- Pin the local-only v0.3.0 `ags-platform`/`contracts` tuple via `.dev/`.
