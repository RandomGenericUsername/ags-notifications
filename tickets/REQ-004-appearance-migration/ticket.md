---
id: REQ-004
title: "Migrate notifications to the v2 Appearance plane"
kind: requirement
status: done
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

- [x] `app.tsx` imports `createAppearance` and builds a module-level
      `appearance` with `configDir: "ags-notifications"`; `main()` calls
      `appearance.apply()`.
- [x] `app.tsx` no longer imports or calls `theme.apply()` or `skin.apply()`.
- [x] The request handler is
      `createAppearanceRefreshHandler(appearance, work)` and the work keeps the
      progress-card icon re-resolution without a `theme.apply()` call.
- [x] The handler still answers only `PALETTE_REFRESH_COMMAND`; no new request
      command or second request handler is added.
- [x] The card width comes from
      `appearance.value("layout.ags-notifications.card-width", 380)` instead of
      the `CARD_WIDTH` constant.
- [x] `style.css` is still present, unmodified as the bundled fallback, and
      still passed to `app.start({ css })`.
- [x] No structure, class, gesture, size or behavior changes.
- [x] `Makefile`, CI and the pin tests target `ags-platform` v0.9.0 and
      `contracts` v0.7.0; the frozen `templates/ags-app/` scaffold is untouched.
- [x] The source-level validation test asserts the Appearance configDir, the
      `main()` apply and the `createAppearanceRefreshHandler` wiring.
- [x] `make gates` passes on the ticket branch.
- [x] The work is committed on `ticket/REQ-004-appearance-migration`; the
      branch is merged fast-forward to `main` and tagged with the next minor
      release without pushing.

## Evidence

- `app.tsx:10-11` imports `createAppearance` from
  `ags-platform/adapters/appearance` and `createAppearanceRefreshHandler` from
  `ags-platform/ports/appearance-refresh`.
- `app.tsx:59` is the module-level
  `const appearance = createAppearance({ configDir: "ags-notifications" })`.
- `app.tsx:68-70` is
  `createAppearanceRefreshHandler(appearance, () => refreshNotificationCardIcons())`;
  the work contains no `theme.apply()` or `skin.apply()`.
- `app.tsx:111` calls `appearance.apply()` in `main()`; `app.tsx:144` passes the
  `cardWidth` accessor into `NotificationsWindow`.
- `app.tsx:75` reads
  `appearance.value("layout.ags-notifications.card-width", 380)`.
- `ui/NotificationsWindow.tsx:14,187,293` import and accept
  `ReadAccessor<number>`; the three card builders use `cardWidth()` at
  `:271`, `:405` and `:642`. The `CARD_WIDTH` constant is gone.
- `style.css` is unchanged: `git diff 9517fb5 -- style.css` prints nothing; the
  file is still imported at `app.tsx:6` and passed as `css: style` at
  `app.tsx:93`.
- `Makefile:8-9` pins `AGS_PLATFORM_VERSION := v0.9.0` and
  `CONTRACTS_VERSION := v0.7.0`; `.github/workflows/ci.yml:25-30` checks out
  the same refs.
- `tests/app-contract.test.mjs:275-340` asserts the Appearance configDir, the
  `main()` apply, the v2 handler wiring, the card-width token and the absence
  of theme/skin application.
- `tests/event-contract-drift.mjs:285-306` asserts the v2 handler, the
  whole-appearance apply, the preserved icon refresh and the absence of direct
  theme/skin application.
- `make gates` with `AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform`
  and `CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts` → exit 0:
  - `make test` — 16/16 pass (6 v2 handler tests + 10 card-model tests);
  - `make conformance` — 16/16 pass;
  - `make drift` — all checks passed;
  - `make bundle` — `build/ags-notifications.js` 949344 bytes;
  - `make typecheck` — 0 errors in the `ags-notifications` tree (27 tolerated
    `/usr/share/ags/js` errors, 0 platform errors).
- Local tuple: platform checkout at tag `v0.9.0`, contracts at `v0.7.0`
  (`git describe --tags --exact-match` in each sibling repo).

Verify:

```sh
cd .worktrees/REQ-004
rg -n 'createAppearance|createAppearanceRefreshHandler|appearance\.apply|appearance\.value' app.tsx
rg -n 'cardWidth|ReadAccessor|CARD_WIDTH' ui/NotificationsWindow.tsx
make gates \
  AGS_PLATFORM_DEV=/home/inumaki/Development/dotfiles/ags-platform \
  CONTRACTS_ROOT=/home/inumaki/Development/dotfiles/contracts
```

## Commits

| Commit | Subject |
| --- | --- |
| `05d0eeb` | `chore(REQ-004): file the v2 appearance migration ticket` |
| `b07c05b` | `feat(REQ-004): migrate to the v2 appearance plane` |
| this closeout commit | `docs(REQ-004): record appearance migration evidence` |

## Deviations / notes

- The now-obsolete pure `lib/appearance.ts` and `lib/palette-refresh.ts` were
  removed. The v2 handler is the platform helper itself, and the unit suite
  executes that helper with a fake appearance instead of a duplicate app-local
  wrapper. This is why `make test` is 16/16 rather than the previous 17/17.
- The single `appearance` instance lives in `app.tsx`; the window receives its
  `layout.ags-notifications.card-width` accessor, so no second adapter instance
  or import cycle is introduced.
- Gate overrides point at the sibling `ags-platform` (`v0.9.0`) and `contracts`
  (`v0.7.0`) checkouts because `.dev/` is gitignored and a new worktree has no
  symlinks. No recipe or pin is changed by the overrides.
- `templates/ags-app/` remains the frozen scaffold and was not modified.
- No visual/behavior change was made, so no new live screenshot was needed;
  the unchanged `style.css` and the source-level gates cover this consumption
  change.
- The fast-forward merge and annotated `v0.4.0` tag happen after this closeout
  commit; nothing is pushed.

## Status

Complete on `ticket/REQ-004-appearance-migration`; worktree
`.worktrees/REQ-004/`, base `9517fb5` (main, `v0.3.0`). The branch is
fast-forward merged to `main` and tagged `v0.4.0`; existing tags are not moved
and nothing is pushed.
