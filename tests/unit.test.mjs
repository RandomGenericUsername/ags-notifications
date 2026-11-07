// ---------------------------------------------------------------------------
// Pure unit tests for ags-notifications (stock runner: Node only, no AGS/GTK).
//
// These execute the platform helper the app registers as its live
// `appearance-refresh` handler:
//   - the requested generation is applied before app-owned icon work;
//   - the work is idempotent by generation hash;
//   - exactly one JSON-string response per request, naming the exact genHash;
//   - the v2 `{"ok":true}` ack and the old `palette-refresh` request are
//     rejected;
//   - the progress-card model runs in the separate card-model.test.ts suite.
//
// Run from the repo root:  make test
// ---------------------------------------------------------------------------

import { test } from "node:test"
import assert from "node:assert/strict"
import {
  APPEARANCE_REFRESH_COMMAND,
  createAppearanceRefreshHandler,
} from "ags-platform/ports/appearance-refresh"

const GENERATION = "a".repeat(64)
const NEXT_GENERATION = "b".repeat(64)
const UNBOUND_HASH = "0".repeat(64)

function fakeAppearance() {
  const applied = []
  return {
    get applied() {
      return applied
    },
    applyGeneration(genHash) {
      applied.push(genHash)
      return { status: "applied", genHash }
    },
  }
}

// ── The v3 appearance-refresh handler ──────────────────────────────────────

test("appearance-refresh applies the requested generation before the icon work", () => {
  const events = []
  const appearance = fakeAppearance()
  const handler = createAppearanceRefreshHandler(appearance, (genHash) => {
    events.push(`icons:${genHash}`)
    return { status: "applied" }
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], () => {})

  assert.deepEqual(appearance.applied, [GENERATION], "the requested generation is applied")
  assert.deepEqual(events, [`icons:${GENERATION}`], "the app-owned icon work runs after it")
})

test("appearance-refresh re-applies the generation but not icon work for the same hash", () => {
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
    return { status: "applied" }
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], () => {})
  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], () => {})

  assert.deepEqual(appearance.applied, [GENERATION, GENERATION], "apply runs every request")
  assert.equal(work, 1, "the same generation hash does not rerun app work")
})

test("appearance-refresh runs the work again for a new generation hash", () => {
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
    return { status: "applied" }
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], () => {})
  handler([APPEARANCE_REFRESH_COMMAND, NEXT_GENERATION], () => {})

  assert.deepEqual(appearance.applied, [GENERATION, NEXT_GENERATION])
  assert.equal(work, 2, "a new hash reruns the app-owned work")
})

test("appearance-refresh answers once with the exact requested generation", () => {
  const responses = []
  const appearance = fakeAppearance()
  const handler = createAppearanceRefreshHandler(appearance, () => ({ status: "applied" }))

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))

  assert.equal(responses.length, 1, "exactly one response")
  assert.equal(typeof responses[0], "string", "AGS transport is a string")
  assert.equal(responses[0], JSON.stringify({ applied: GENERATION }))
  assert.doesNotMatch(responses[0], /"ok"/, "v3 never emits the v2 ok ack")
})

test("appearance-refresh reports a thrown icon refresh as a retryable failure", () => {
  const responses = []
  const appearance = fakeAppearance()
  let work = 0
  const handler = createAppearanceRefreshHandler(appearance, () => {
    work += 1
    if (work === 1) throw new Error("icon manifest missing")
    return { status: "applied" }
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))
  assert.deepEqual(JSON.parse(responses[0]), {
    failed: "icon manifest missing",
    retryable: true,
    genHash: GENERATION,
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))
  assert.equal(work, 2, "the failed hash was not recorded as applied")
  assert.deepEqual(JSON.parse(responses[1]), { applied: GENERATION })
})

test("appearance-refresh forwards a deferred apply with the requested hash", () => {
  const responses = []
  const handler = createAppearanceRefreshHandler({
    applyGeneration(genHash) {
      return { status: "deferred", reason: "current generation moved", genHash }
    },
  }, () => {
    throw new Error("work must not run after a deferred apply")
  })

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))

  assert.deepEqual(JSON.parse(responses[0]), {
    deferred: "current generation moved",
    genHash: GENERATION,
  })
})

test("appearance-refresh rejects malformed and v2 palette-refresh requests", () => {
  const responses = []
  let work = 0
  const handler = createAppearanceRefreshHandler(fakeAppearance(), () => {
    work += 1
    return { status: "applied" }
  })

  handler([APPEARANCE_REFRESH_COMMAND], (response) => responses.push(response))
  handler(["palette-refresh", GENERATION], (response) => responses.push(response))
  handler([APPEARANCE_REFRESH_COMMAND, "not-a-generation-hash"], (response) => responses.push(response))

  assert.equal(responses.length, 3)
  assert.equal(work, 0, "malformed requests never run the app work")
  for (const response of responses) {
    const parsed = JSON.parse(response)
    assert.equal(parsed.ok, undefined)
    assert.equal(parsed.retryable, false)
    assert.equal(parsed.failed, "malformed appearance-refresh request")
    assert.match(parsed.genHash, /^[0-9a-f]{64}$/)
  }
  assert.equal(JSON.parse(responses[0]).genHash, UNBOUND_HASH)
  assert.equal(JSON.parse(responses[1]).genHash, GENERATION)
})

test("appearance-refresh rejects a v2 ok work result as a terminal failure", () => {
  const responses = []
  const handler = createAppearanceRefreshHandler(fakeAppearance(), (() => {
    return { ok: true }
  }))

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))

  assert.deepEqual(JSON.parse(responses[0]), {
    failed: "invalid appearance-refresh work result",
    retryable: false,
    genHash: GENERATION,
  })
})

test("appearance-refresh rejects a void work result", () => {
  const responses = []
  const handler = createAppearanceRefreshHandler(fakeAppearance(), () => {})

  handler([APPEARANCE_REFRESH_COMMAND, GENERATION], (response) => responses.push(response))

  assert.deepEqual(JSON.parse(responses[0]), {
    failed: "invalid appearance-refresh work result",
    retryable: false,
    genHash: GENERATION,
  })
})
