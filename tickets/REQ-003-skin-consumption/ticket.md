---
id: REQ-003
title: "Consume the app-scoped skin plane without changing the glass fallback"
kind: requirement
status: done
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

- [x] `app.tsx` imports `createAppSkin` and builds a module-level
      `skin` with `configDir: "ags-notifications"`.
- [x] `main()` applies the theme first and then the skin, in that order.
- [x] `style.css` is still present and still the bundled fallback CSS passed to
      `app.start({ css })`.
- [x] The request handler still answers only `PALETTE_REFRESH_COMMAND`; no
      skin-refresh request/handler is introduced.
- [x] No structure, class, gesture, size or behavior changes.
- [x] `Makefile`, CI and tests pin `ags-platform` v0.8.0 and `contracts`
      v0.6.0; the frozen `templates/ags-app/` scaffold is untouched.
- [x] A source-level validation test asserts theme-then-skin application, the
      `ags-notifications` configDir, the absence of a new request handler, and
      the continued presence of `style.css`.
- [x] `make gates` passes on the ticket branch.
- [x] The work is committed on `ticket/REQ-003-skin-consumption`; the branch is
      merged fast-forward to `main` and tagged with the next minor release
      (`v0.3.0`).

## Evidence

- `app.tsx` module scope: `const skin = createAppSkin({ configDir:
  "ags-notifications" })` (imported from `ags-platform/adapters/skin`).
- `app.tsx` `main()`: `theme.apply()` (inside its existing try/catch) precedes
  `skin.apply()`; the daemon probe and window creation follow unchanged.
- `app.tsx` `requestHandler` still dispatches only `PALETTE_REFRESH_COMMAND`;
  the handler body contains no skin request and there is exactly one
  `requestHandler(` registration.
- `style.css` is still imported (`import style from "./style.css"`) and passed
  as `app.start({ css: style })`; the file is unmodified.
- `createAppSkinValue` is intentionally not used: the v1 token vocabulary's
  layout tokens are TSX-owned and none apply to this app.
- `Makefile`: `AGS_PLATFORM_VERSION := v0.8.0`, `CONTRACTS_VERSION := v0.6.0`;
  `.github/workflows/ci.yml` checks out the same refs.
- `make gates` (local overrides below) → exit 0:
  - `make test` — 17/17 pass;
  - `make conformance` — 16/16 pass, including the new source-level skin test;
  - `make drift` — all checks passed;
  - `make bundle` — `build/ags-notifications.js` 970276 bytes;
  - `make typecheck` — 0 errors in the `ags-notifications` tree (27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors).

Verify:

```sh
cd .worktrees/REQ-003
make gates \
  AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform \
  CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts
rg -n 'createAppSkin|skin\.apply|theme\.apply|requestHandler' app.tsx
test -f style.css && echo 'style.css present'
```

## Commits

| Commit | Subject |
| --- | --- |
| `e7208ee` | `chore(REQ-003): file the app-scoped skin consumption ticket` |
| `df78b3b` | `feat(REQ-003): consume the app-scoped skin after the theme` |
| this closeout commit | `docs(REQ-003): record skin consumption evidence` |

## Deviations / notes

- The worktree's gates used `AGS_PLATFORM_DEV` and `CONTRACTS_ROOT` pointing at
  the sibling checkouts (`ags-platform` v0.8.0, `contracts` v0.6.0) because
  `.dev/` symlinks are gitignored and not copied into a new worktree. No
  override changes a recipe or a pin.
- `templates/ags-app/` remains the frozen v0.3.0 scaffold; this consumer change
  does not refresh it (same boundary as REQ-002).
- Tagging and the fast-forward merge happen after this closeout commit on
  `main`; the annotated `v0.3.0` tag is recorded in the release report.

## Status

Complete on `ticket/REQ-003-skin-consumption`; worktree `.worktrees/REQ-003/`,
base `31e6059` (main, `v0.2.1`). The branch is fast-forward merged to `main`
and tagged `v0.3.0`; existing tags are not moved.
