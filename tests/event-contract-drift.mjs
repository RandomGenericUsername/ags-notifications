// Contract drift + event-consumer + daemon-hosting gate for notifications.
//
// Pins the SHARED platform event client (spine AD-5, `ags-platform/ports/
// event-client`) against the canonical contract (`contracts/event-contract
// .json` / `.xml`), exercises its subscribe-before-read hydration state machine
// for the two topics the cards consume (`wallpaper.state`, `speedtest.state`)
// with a scripted fake transport (no live bus), pins the cards' pure stage
// model to the contract's stage enum, and asserts the structural facts the
// standalone repo turns on: the app still HOSTS `org.freedesktop.Notifications`,
// the cards consume the ONE platform event client (no app-local reader), and
// `appearance-refresh` is the v3 generation-bound handler with the app-owned
// progress-icon work (never a card/daemon rebuild). Executed, never
// text-scanned -- except the structural source reads, labelled as such.
//
// Run from the repo root:  make drift

import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
// The ONE event client: the app-local readers are gone, so this gate reads the
// platform's shared client through the dev `node_modules/ags-platform`
// shortcut `make platform-dev` creates (its target sits outside node_modules so
// Node's type-stripping accepts the `.ts` source).
import * as core from "ags-platform/ports/event-client"
import {
  SPEEDTEST_STEPS,
  WALLPAPER_STEPS,
  stageIndex,
  statusForStage,
} from "../lib/card-model.ts"

const here = dirname(fileURLToPath(import.meta.url))
const appRoot = join(here, "..")

// The canonical contract lives in the sibling `contracts` repo (AGENTS: every
// app depends on `contracts`). `CONTRACTS_REPO` overrides the location (the
// Makefile and CI set it); otherwise search upward for a checkout, mirroring
// the repo's cross-repo reads. A missing contract FAILS -- never a silent skip:
// a drift gate that cannot read the contract proves nothing.
function findContractsRepo() {
  const override = process.env.CONTRACTS_REPO
  if (override) return override
  let dir = here
  for (let i = 0; i < 8; i += 1) {
    dir = dirname(dir)
    if (existsSync(join(dir, "contracts", "event-contract.json"))) {
      return join(dir, "contracts")
    }
  }
  return null
}

const contractsRepo = findContractsRepo()
if (contractsRepo === null) {
  console.error(
    "FAIL: cannot find the `contracts` repo (set CONTRACTS_REPO=/path/to/contracts)",
  )
  process.exit(1)
}
const contractJson = JSON.parse(
  readFileSync(join(contractsRepo, "event-contract.json"), "utf-8"),
)
const contractXml = readFileSync(
  join(contractsRepo, "event-contract.xml"),
  "utf-8",
)

let failures = 0
function check(name, actual, expected) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    failures += 1
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`)
  } else {
    console.log(`ok ${name}`)
  }
}

// ── Drift: every baked constant is a machine-definition value ────────────

check("bus name", core.EVENTS_BUS_NAME, contractJson.well_known_name)
check("object path", core.EVENTS_OBJECT_PATH, contractJson.object_path)
check("interface", core.EVENTS_INTERFACE, contractJson.interface)
check("DomainEvent signal", contractJson.signals[core.DOMAIN_EVENT_SIGNAL] !== undefined, true)
check("JobsCleared signal", contractJson.signals[core.JOBS_CLEARED_SIGNAL] !== undefined, true)
check("Control method", contractJson.methods[core.CONTROL_METHOD] !== undefined, true)
check("GetTopicState method", contractJson.methods[core.HYDRATION_METHOD] !== undefined, true)
check(
  "GetTopicState returns reserved _epoch/_seq",
  contractJson.methods.GetTopicState.out,
  ["state:a{sv}"],
)
check(
  "speedtest.state is the exported topic constant",
  core.SPEEDTEST_STATE_TOPIC,
  "speedtest.state",
)
check("xml declares the hub interface", contractXml.includes(core.EVENTS_INTERFACE), true)

// ── The two topics the cards consume ─────────────────────────────────────
//
// The card code reads exactly these keys; if the contract renames one, the
// card renders a blank and this gate must fail first.

const wallpaper = contractJson.topics["wallpaper.state"]
check("wallpaper.state is a contract topic", wallpaper !== undefined, true)
check(
  "wallpaper.state payload keys",
  Object.keys(wallpaper.payload).sort(),
  ["reload_failures", "stage", "state", "trigger", "wallpaper_hash"],
)
check(
  "wallpaper.state enum.state",
  wallpaper.enum.state,
  ["applying", "visible", "done", "error"],
)
check(
  "wallpaper.state enum.trigger",
  wallpaper.enum.trigger,
  ["set", "regenerate", "reconcile", "reactive"],
)
check(
  "wallpaper.state enum.stage",
  wallpaper.enum.stage,
  [
    "setting_wallpaper",
    "generating_palette",
    "palette_generated",
    "preparing_appearance_assets",
    "appearance_assets_ready",
    "reconciling_consumers",
    "finished",
  ],
)

const speedtest = contractJson.topics["speedtest.state"]
check("speedtest.state is a contract topic", speedtest !== undefined, true)
check(
  "speedtest.state payload keys",
  Object.keys(speedtest.payload).sort(),
  ["down_mbps", "latency_ms", "reason", "server_name", "ssid", "state", "trigger", "up_mbps"],
)
check(
  "speedtest.state enum.state",
  speedtest.enum.state,
  ["starting", "done", "error"],
)
check(
  "speedtest.state enum.trigger",
  speedtest.enum.trigger,
  ["scheduled", "manual", "connect"],
)

// ── The cards' pure stage model is pinned to the contract enum ───────────
//
// `stageIndex` and `statusForStage` are what turn a contract stage into the
// progress card's checked/active rows and copy. Every contract stage must map
// inside the four-step list (finished is the terminal index), and an unknown
// stage must stay at the safe start rather than throwing.

for (const stage of wallpaper.enum.stage) {
  const index = stageIndex(stage)
  check(`stageIndex(${stage}) is in range`, index >= 0 && index <= WALLPAPER_STEPS.length, true)
  check(`statusForStage(${stage}) is non-empty`, statusForStage(stage).length > 0, true)
}
check("stageIndex(finished) is the terminal index", stageIndex("finished"), WALLPAPER_STEPS.length)
check("stageIndex(unknown) is the safe start", stageIndex("not-a-contract-stage"), 0)
check("the speed-test list keeps its four steps", SPEEDTEST_STEPS.length, 4)

// ── Subscribe-before-read hydration state machine (fake transport) ───────

function fakeTransport(states) {
  const calls = []
  const signals = { onDomainEvent: null, onJobsCleared: null, onHubRestart: null }
  let state = { ...states }
  const transport = {
    startSignals(onDomainEvent, onJobsCleared, onHubRestart) {
      calls.push("startSignals")
      signals.onDomainEvent = onDomainEvent
      signals.onJobsCleared = onJobsCleared
      signals.onHubRestart = onHubRestart
    },
    getTopicState(topic) {
      calls.push(`getTopicState:${topic}`)
      return topic in state ? state[topic] : null
    },
    control(jobId, action) {
      calls.push(`control:${jobId}:${action}`)
    },
  }
  return { transport, calls, signals, setState: (next) => { state = { ...next } } }
}

// Hydration on subscribe delivers the last wallpaper payload immediately, so a
// notifications app that starts mid-update renders the in-flight card.
{
  const fake = fakeTransport({
    "wallpaper.state": { state: "applying", wallpaper_hash: "h1", trigger: "set", _epoch: 4, _seq: 9 },
  })
  const bus = new core.DomainEventBusCore(fake.transport)
  const seen = []
  bus.subscribe("wallpaper.state", (_t, payload) => seen.push(payload))
  check("subscribe starts signals before hydrating", fake.calls[0], "startSignals")
  check("subscribe hydrates wallpaper.state", fake.calls[1], "getTopicState:wallpaper.state")
  check("hydrated wallpaper payload delivered", seen, [{ state: "applying", wallpaper_hash: "h1", trigger: "set" }])
  check("hydrated pair recorded", bus.hydratedPair("wallpaper.state"), [4, 9])
}

// A stale speedtest signal is dropped; a newer one is delivered once.
{
  const fake = fakeTransport({
    "speedtest.state": { state: "starting", trigger: "manual", _epoch: 2, _seq: 5 },
  })
  const bus = new core.DomainEventBusCore(fake.transport)
  const seen = []
  bus.subscribe("speedtest.state", (_t, payload) => seen.push(payload.state))
  fake.signals.onDomainEvent([
    "speedtest.state",
    ":1.1",
    4, // seq <= baseline 5 -> stale
    2,
    { state: "done", trigger: "manual" },
  ])
  check("stale speedtest signal dropped", seen, ["starting"])
  fake.signals.onDomainEvent([
    "speedtest.state",
    ":1.1",
    6,
    2,
    { state: "done", trigger: "manual" },
  ])
  check("newer speedtest signal delivered", seen, ["starting", "done"])
  check("baseline advanced", bus.hydratedPair("speedtest.state"), [2, 6])
}

// ── Structural: the app hosts the notification daemon ────────────────────
//
// The standalone extraction keeps ownership of `org.freedesktop.Notifications`:
// the app is the daemon, so it must still claim the name and acquire the
// AstalNotifd daemon. A source read, labelled as structural (the alternative --
// running a second daemon -- would fight the live instance).

const appSource = readFileSync(join(appRoot, "app.tsx"), "utf-8")
check(
  "app.tsx claims org.freedesktop.Notifications",
  /NOTIFICATIONS_NAME\s*=\s*"org\.freedesktop\.Notifications"/.test(appSource),
  true,
)
check("app.tsx probes the bus before acquiring the daemon", appSource.includes("NameHasOwner"), true)
check("app.tsx acquires the AstalNotifd daemon", appSource.includes("Notifd.get_default()"), true)

// ── Structural: the cards consume the ONE platform event client (AD-5) ───

const windowSource = readFileSync(join(appRoot, "ui", "NotificationsWindow.tsx"), "utf-8")
check(
  "window imports the platform event client",
  /from\s+"ags-platform\/adapters\/event-bus"/.test(windowSource),
  true,
)
check(
  "window subscribes wallpaper.state",
  windowSource.includes('domainEvents.subscribe("wallpaper.state"'),
  true,
)
check(
  "window subscribes speedtest.state",
  windowSource.includes('domainEvents.subscribe("speedtest.state"'),
  true,
)
check(
  "window has no app-local event reader import",
  /from\s+"\.\.\/lib\/(speedtest|wallpaper)-events"/.test(windowSource),
  false,
)

// ── Structural: the real, non-destructive appearance-refresh handler ─────
//
// The v0.5.0 work was `theme.apply(); refreshNotificationCardIcons()`. In the
// v3 plane the platform helper applies the requested generation first; the app
// keeps only the derived icon work, reports it as applied, and must not
// rebuild/dismiss the progress cards or tear down the daemon/bus.

check(
  "app uses the v3 appearance-refresh handler",
  /createAppearanceRefreshHandler\(appearance,/.test(appSource),
  true,
)
check(
  "app dispatches appearance-refresh",
  /APPEARANCE_REFRESH_COMMAND/.test(appSource),
  true,
)
check(
  "app does not dispatch the v2 palette-refresh command",
  /PALETTE_REFRESH_COMMAND|["']palette-refresh["']/.test(appSource),
  false,
)
check(
  "app applies the committed generation in main()",
  /main\(\)\s*\{[\s\S]*?appearance\.apply\(\)/.test(appSource),
  true,
)
check(
  "app keeps the real progress-card icon refresh",
  /refreshNotificationCardIcons\(\)/.test(appSource),
  true,
)
check(
  "app reports the v3 work as applied",
  /return \{ status: "applied" \}/.test(appSource),
  true,
)
check(
  "app never produces the v2 ok ack",
  /["']ok["']\s*:\s*true|ok:\s*true/.test(appSource),
  false,
)
check(
  "app no longer applies theme or skin directly",
  /\b(?:theme|skin)\.apply\(\)/.test(appSource),
  false,
)
check(
  "window exposes the progress-card icon refresher",
  /export function refreshNotificationCardIcons/.test(windowSource),
  true,
)
check(
  "window does not apply the palette from wallpaper.state",
  /theme\.apply/.test(windowSource),
  false,
)

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log("\nall checks passed")
