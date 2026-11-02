---
id: REQ-002
title: "Migrate notifications CSS to semantic palette.v1 roles"
kind: requirement
status: done
lane: 3
links:
  openspec: none
  bmad: none
worktree: .worktrees/REQ-002/
branch: ticket/REQ-002-theme-roles
---

# Migrate notifications CSS to semantic palette.v1 roles

## Requirement

Move `style.css` off the legacy `@color_*` projection and onto the
`palette.v1` role names that the `ags-platform` v0.4.0 Theme provider projects
as `@define-color <role> <hex>` (REQ-013 Phase A). Map by intent, not by legacy
index: ink is `on_surface`, surfaces are `surface`, accents are `primary`, and
critical/failed states are error roles. Keep every selector, size, border
radius, and `alpha()` opacity exactly as it is; only the named color changes.

Bump the local/CI/test platform pin to `v0.4.0` so the gates exercise the
provider that defines the roles. `contracts` stays at `v0.3.0`.

## Acceptance

- [x] `style.css` (comments included) contains no `@color_*` token;
      `rg '@color_' style.css` returns nothing.
- [x] Every color reference is a `palette.v1` role; no literal colors added.
- [x] Geometry, selectors, font sizes and alpha values are unchanged.
- [x] The legacy-token mapping is recorded with a per-token rationale.
- [x] `Makefile`, CI and tests pin `ags-platform` v0.4.0; `contracts` stays
      v0.3.0.
- [x] `make test`, `make conformance`, `make drift`, `make typecheck` and
      `make bundle` pass on the ticket branch.
- [x] A real notification-card screenshot is captured with `grim`; the command
      to reproduce it is recorded.
- [x] The work is committed on `ticket/REQ-002-theme-roles`; nothing is pushed,
      tagged or merged.

## Mapping

| Legacy token | Role | Context / rationale |
| --- | --- | --- |
| `@color_00` | `surface` | Card panel plate (`alpha .92`); the old `color_00` alias was `surface`. |
| `@color_background` | `surface` | Comment-only alias for the stacked surface; the compatibility alias also points at `surface`. |
| `@color_foreground` | `on_surface` | All ink and ink-derived hairlines/dim text; the legacy alias is `on_surface`. |
| `@color_06` | `primary` | Used as the stack accent: tile/icon plate, action chips, active/done markers, progress fill, highlighted cells. Legacy `color_06` is `outline_variant`, but in this app it carries accent intent. |
| `@color_03` | `error` / `error_container` | All 16 uses are critical notification / failed speed-test / failed step states. `error` carries ink, icons and borders; `error_container` carries the low-alpha plate fills. Legacy `color_03` is `secondary`, which does not describe severity. |

## Evidence

- `rg '@color_' style.css` → no matches after migration.
- `make gates` → exit 0: `test` 17/17, `conformance` 14/14 (including the new
  role-only-stylesheet assertion), `drift` all checks passed, `bundle`
  `build/ags-notifications.js` 850972 bytes, `typecheck` 0 errors in this tree
  (27 tolerated `/usr/share/ags/js` errors, 0 platform errors).
- Platform provider contract: `ags-platform` v0.4.0 `ports/palette.ts` projects
  every declared role as `@define-color <role> <hex>;`; `ports/theme.ts`
  composes that block into the one provider.
- Legacy alias order: `theme-producer` `domain/services.py` `LEGACY_COLOR_ORDER`
  (`color00`=surface … `color03`=secondary, `color06`=outline_variant) and
  `colors.gtk.css.j2` (`color_background`=surface, `color_foreground`=on_surface).
- Screenshot: `/tmp/opencode/notif-new.png` (full frame) and
  `/tmp/opencode/notif-new-crop.png` (notification stack). The branch app was
  run inside `dbus-run-session` so it hosted `org.freedesktop.Notifications` on
  an isolated bus instead of taking over the live session daemon; two
  `notify-send` cards were captured with `grim`.
- Reproduction: from this worktree,
  `dbus-run-session -- bash -lc 'GTK_A11Y=none ags run -d . & sleep 8; notify-send -u critical "Disk almost full" "Only 512 MB remain on /home."; sleep 2; grim /tmp/notif.png'`
  (add `export GTK_A11Y=none` as shown when the private bus has no a11y
  registry).

## Dependencies

- `ags-platform` v0.4.0 (palette roles/provider).
- `contracts` v0.3.0 (unchanged).
