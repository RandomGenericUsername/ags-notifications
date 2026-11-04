---
id: BUG-001
title: "Notification card is translucent: underlying window text bleeds through"
kind: bug
status: in-progress
lane: 2
links:
  openspec: none
  bmad: none
worktree: none
branch: main
severity: medium
---

# Notification cards bleed the window behind

## Evidence

- Live screenshot (2026-11-04) of the wallpaper-complete toast over the chat
  window: the chat text (“…producing, palette, icons…” and the cost line) is
  legible through the card, overlapping the subtitle/checklist.
- `.notif-card` uses `background-color: alpha(@surface, 0.92)`; the notification
  window itself is transparent. Notifications overlay arbitrary app content, so
  8% transparency lets light text through.
- The completed wallpaper progress bar is intentionally left at 100% (same as
  the speed-test card); not part of this bug.

## Requirement

Notification cards are opaque: `background-color: @surface` (no alpha). Keep the
border and shadow. Add a regression check that the `.notif-card` background is
not alpha-blended.

## Acceptance

- [ ] `.notif-card` background is solid `@surface`.
- [ ] Regression test asserts no `alpha(` on that background.
- [ ] Live: a completion toast over a text-heavy window shows no bleed-through.
- [ ] Gates green; tag v0.2.1.
