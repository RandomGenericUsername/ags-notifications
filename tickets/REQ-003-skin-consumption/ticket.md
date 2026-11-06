---
id: REQ-003
title: "Consume the app-scoped skin plane without changing the glass fallback"
kind: requirement
status: in-progress
lane: 3
links:
  openspec: none
  bmad: none
worktree: .worktrees/REQ-003/
branch: ticket/REQ-003-skin-consumption
---

# Consume the app-scoped skin plane without changing the glass fallback

## Requirement

Adopt the platform v0.8.0 app-scoped skin factory in `app.tsx`. A module-level
`const skin = createAppSkin({ configDir: "ags-notifications" })` reads this
app's runtime-expanded `$XDG_CONFIG_HOME/ags-notifications/skin.css` plus the
shared token map, and `main()` calls `skin.apply()` immediately after
`theme.apply()` so the skin provider is installed after the palette provider.

The change is consumption only:

- `style.css` stays the bundled glass fallback and is not modified;
- no class, gesture, size, structure or behavior changes;
- layout tokens are TSX-owned and none apply to this app in v1, so no
  `createAppSkinValue` call is added;
- the existing palette-refresh handler stays exactly as it is; no skin-refresh
  request is added because the adapter's `Gio.FileMonitor` reloads `skin.css`;
- the local/CI pins move to `ags-platform` v0.8.0 and `contracts` v0.6.0.

## Acceptance

- [ ] `app.tsx` imports `createAppSkin` and builds a module-level
      `skin` with `configDir: "ags-notifications"`.
- [ ] `main()` applies the theme first and then the skin, in that order.
- [ ] `style.css` is still present and still the bundled fallback CSS passed to
      `app.start({ css })`.
- [ ] The request handler still answers only `PALETTE_REFRESH_COMMAND`; no
      skin-refresh request/handler is introduced.
- [ ] No structure, class, gesture, size or behavior changes.
- [ ] `Makefile`, CI and tests pin `ags-platform` v0.8.0 and `contracts`
      v0.6.0; the frozen `templates/ags-app/` scaffold is untouched.
- [ ] A source-level validation test asserts theme-then-skin application, the
      `ags-notifications` configDir, the absence of a new request handler, and
      the continued presence of `style.css`.
- [ ] `make gates` passes on the ticket branch.
- [ ] The work is committed on `ticket/REQ-003-skin-consumption`; the branch is
      merged fast-forward to `main` and tagged with the next minor release.
