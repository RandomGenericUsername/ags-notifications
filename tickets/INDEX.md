# Ticket index

> Counting rule: completeness checks cover item files (`tickets/<id>-<slug>/ticket.md`) only.
> `tickets/_template/` (and any `tickets/_fixtures/`) are excluded from INDEX completeness counting.
> Entry format: link — title | `status` | execution links. Epics add `done/total children done`, done-when, and one nested line per child. Bugs add severity. Spikes add timebox state.

## Epics

(none)

## Requirements

- [REQ-001-standalone-notifications/ticket.md](./REQ-001-standalone-notifications/ticket.md) — Extract the notifications stack into the standalone ags-notifications repo | `done` | links: worktree none, branch main
- [REQ-002-theme-roles/ticket.md](./REQ-002-theme-roles/ticket.md) — Migrate notifications CSS to semantic palette.v1 roles | `done` | links: worktree .worktrees/REQ-002/, branch ticket/REQ-002-theme-roles
- [REQ-003-skin-consumption/ticket.md](./REQ-003-skin-consumption/ticket.md) — Consume the app-scoped skin plane without changing the glass fallback | `done` | links: worktree .worktrees/REQ-003/, branch ticket/REQ-003-skin-consumption
- [REQ-004-appearance-migration/ticket.md](./REQ-004-appearance-migration/ticket.md) — Migrate notifications to the v2 Appearance plane | `done` | links: worktree .worktrees/REQ-004/, branch ticket/REQ-004-appearance-migration
- [REQ-005-generations-v3/ticket.md](./REQ-005-generations-v3/ticket.md) — Migrate notifications to Generations v3 appearance-refresh | `done` | links: worktree .worktrees/REQ-005/, branch ticket/REQ-005-generations-v3, tag v0.5.0

## Bugs

- [BUG-001-translucent-card/ticket.md](./BUG-001-translucent-card/ticket.md) — Notification card translucent; window text bleeds through | `done` | tag: v0.2.1 | live: opaque card captured | severity: medium

## Ops tasks

- [OPS-001-dev-pin-parity/ticket.md](./OPS-001-dev-pin-parity/ticket.md) — Align the local dev pin with ags-platform v1.0.1 | `done` | links: worktree .worktrees/OPS-001/, branch ticket/OPS-001-dev-pin-parity, tag v0.5.1
- [OPS-003-dev-pin-parity-v1.1.0/ticket.md](./OPS-003-dev-pin-parity-v1.1.0/ticket.md) — Align the local dev pin with ags-platform v1.1.0 and contracts v0.12.0 | `in-progress` | links: worktree .worktrees/OPS-003/, branch ticket/OPS-003-dev-pin-parity-v1.1.0

## Spikes

(none)

## Tasks

(none)

## Done (links only, newest last)

(none)
