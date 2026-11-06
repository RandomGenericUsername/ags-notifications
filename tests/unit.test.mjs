// ---------------------------------------------------------------------------
// Pure unit tests for ags-notifications (stock runner: Node only, no AGS/GTK).
//
// These execute the platform helper the app registers as its live
// `palette-refresh` handler:
//   - the whole appearance is re-applied before app-owned icon work;
//   - the work is idempotent by appearance hash;
//   - exactly one JSON-string response per request;
//   - the progress-card model runs in the separate card-model.test.ts suite.
//
// Run from the repo root:  make test
// ---------------------------------------------------------------------------

import { test } from "node:test"
import assert from "node:assert/strict"
import { PALETTE_REFRESH_COMMAND } from "ags-platform/ports/palette-refresh"
import { createAppearanceRefreshHandler } from "ags-platform/ports/appearance-refresh"

const HASH = "appearance-2026-11-06"

function fakeAppearance() {
  let applies = 0
  return {
    get applies() {
      return applies
    },
    apply() {
      applies += 1
    },
  }
}

// ── The v2 palette-refresh handler ─────────────────────────────────────────

test("palette-refresh applies the whole appearance before the icon work", () => {
  const calls = []
  const appearance = fakeAppearance()
  const handler = createAppearanceRefreshHandler(appearance, (hash) => {
    calls.push(`icons:${hash}`)
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], () => {})

  assert.equal(appearance.applies, 1, "the whole appearance is re-applied")
  assert.deepEqual(calls, [`icons:${HASH}`], "the app-owned icon work runs after it")
})

test("palette-refresh re-applies appearance but not icon work for the same hash", () => {
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], () => {})
  handler([PALETTE_REFRESH_COMMAND, HASH], () => {})

  assert.equal(appearance.applies, 2, "appearance.apply() always runs")
  assert.equal(work, 1, "the same appearance hash does not rerun app work")
})

test("palette-refresh runs the work again for a new appearance hash", () => {
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], () => {})
  handler([PALETTE_REFRESH_COMMAND, "appearance-next"], () => {})

  assert.equal(appearance.applies, 2)
  assert.equal(work, 2, "a new hash reruns the app-owned work")
})

test("palette-refresh answers once with the protocol's JSON string", () => {
  const responses = []
  const appearance = fakeAppearance()
  const handler = createAppearanceRefreshHandler(appearance, () => {})

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))

  assert.equal(responses.length, 1, "exactly one response")
  assert.equal(typeof responses[0], "string", "AGS transport is a string")
  assert.equal(responses[0], JSON.stringify({ ok: true }))
})

test("palette-refresh reports a thrown icon refresh as a retryable failure", () => {
  const responses = []
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
    if (work === 1) throw new Error("icon manifest missing")
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))
  assert.equal(appearance.applies, 1, "appearance still applied first")
  assert.deepEqual(JSON.parse(responses[0]), {
    ok: false,
    error: "icon manifest missing",
    retryable: true,
  })

  handler([PALETTE_REFRESH_COMMAND, HASH], (response) => responses.push(response))
  assert.equal(work, 2, "the failed hash was not recorded as applied")
  assert.deepEqual(JSON.parse(responses[1]), { ok: true })
})

test("a malformed palette-refresh request never runs appearance or work", () => {
  const responses = []
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
  })

  handler([PALETTE_REFRESH_COMMAND], (response) => responses.push(response))

  assert.equal(appearance.applies, 0)
  assert.equal(work, 0)
  assert.equal(responses.length, 1)
  assert.deepEqual(JSON.parse(responses[0]), {
    ok: false,
    error: "malformed palette-refresh request",
    retryable: false,
  })
})
