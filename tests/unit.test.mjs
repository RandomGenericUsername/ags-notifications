// ---------------------------------------------------------------------------
// Pure unit tests for ags-notifications (stock runner: Node only, no AGS/GTK).
//
// These execute the app's real pure modules:
//   - the palette-refresh handler wiring and its JSON-string response;
//   - the appearance refresh order and hash idempotency;
//   - the progress-card model (the separate card-model.test.ts suite).
//
// Run from the repo root:  make test
// ---------------------------------------------------------------------------

import { test } from "node:test"
import assert from "node:assert/strict"
import { PALETTE_REFRESH_COMMAND } from "ags-platform/ports/palette-refresh"
import {
  applyAppearance,
  createAppearanceRefresh,
} from "../lib/appearance.ts"
import { createNotificationsPaletteRefresh } from "../lib/palette-refresh.ts"

const HASH = "appearance-2026-10-27"

// ── Appearance refresh core ────────────────────────────────────────────────

test("applyAppearance re-applies the theme before refreshing card icons", () => {
  const calls = []
  applyAppearance({
    applyTheme: () => calls.push("theme"),
    refreshCardIcons: () => calls.push("icons"),
  })
  assert.deepEqual(calls, ["theme", "icons"])
})

test("appearance refresh is idempotent by appearance hash", () => {
  let applies = 0
  const refresh = createAppearanceRefresh(() => {
    applies += 1
  })

  assert.deepEqual(refresh(HASH), { status: "applied" })
  assert.equal(applies, 1, "first hash applies")

  assert.deepEqual(refresh(HASH), { status: "applied" })
  assert.equal(applies, 1, "the same hash is a safe no-op")

  assert.deepEqual(refresh("appearance-next"), { status: "applied" })
  assert.equal(applies, 2, "a new hash applies again")
})

test("a failed appearance refresh is retried for the same hash", () => {
  let applies = 0
  const refresh = createAppearanceRefresh(() => {
    applies += 1
    if (applies === 1) throw new Error("palette not ready")
  })

  assert.throws(() => refresh(HASH), /palette not ready/)
  assert.deepEqual(refresh(HASH), { status: "applied" })
  assert.equal(applies, 2, "the failed hash was not recorded as applied")
})

// ── The real palette-refresh handler ───────────────────────────────────────

test("palette-refresh answers once with the protocol's JSON string", () => {
  const responses = []
  let applies = 0
  const handler = createNotificationsPaletteRefresh(() => {
    applies += 1
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))

  assert.equal(applies, 1, "the real refresh ran")
  assert.equal(responses.length, 1, "exactly one response")
  assert.equal(typeof responses[0], "string", "AGS transport is a string")
  assert.equal(responses[0], JSON.stringify({ ok: true }))
})

test("palette-refresh is a no-op for the same hash but still applied", () => {
  const responses = []
  let applies = 0
  const handler = createNotificationsPaletteRefresh(() => {
    applies += 1
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))
  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))

  assert.equal(applies, 1, "same appearance must not refresh twice")
  assert.deepEqual(responses, [JSON.stringify({ ok: true }), JSON.stringify({ ok: true })])
})

test("palette-refresh reports a thrown refresh as a retryable failure", () => {
  const responses = []
  const handler = createNotificationsPaletteRefresh(() => {
    throw new Error("theme pointer missing")
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))

  assert.equal(responses.length, 1)
  assert.deepEqual(JSON.parse(responses[0]), {
    ok: false,
    error: "theme pointer missing",
    retryable: true,
  })
})

test("a malformed palette-refresh request never runs the refresh", () => {
  const responses = []
  let applies = 0
  const handler = createNotificationsPaletteRefresh(() => {
    applies += 1
  })

  handler([PALETTE_REFRESH_COMMAND], (response) => responses.push(response))
  assert.equal(applies, 0)
  assert.equal(responses.length, 1)
  assert.deepEqual(JSON.parse(responses[0]), {
    ok: false,
    error: "malformed palette-refresh request",
    retryable: false,
  })
})
