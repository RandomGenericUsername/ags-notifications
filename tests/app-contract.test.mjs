// ---------------------------------------------------------------------------
// Manifest + handler + template conformance for ags-notifications
// (AD-26/AD-27/AD-33/AD-35).
//
// This is the repo-local gate the standalone contract requires:
//   1. `app.manifest.json` is schema-valid and carries the notifications
//      identity;
//   2. app.tsx / window / style / README agree with that identity;
//   3. the live appearance-refresh handler applies the requested generation and
//      keeps the app-owned progress-card icon work; it is non-destructive: no
//      card rebuild, no daemon teardown, no wallpaper.state palette application;
//   4. the shared dev-flow template (AGENTS, tickets, guard, Makefile, CI,
//      tests, templates/ags-app) is present and the platform's own
//      `checkAppRepo` template gate passes;
//   5. no app source imports the old monorepo layout.
//
// Run from the repo root:  make conformance
// ---------------------------------------------------------------------------

import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseAgsAppManifest } from "ags-platform/ports/app-manifest"
import {
  checkAppRepoAt,
  formatAppConformanceReport,
} from "ags-platform/conformance/app-conformance"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

const IDENTITY = {
  schemaVersion: 1,
  app: "notifications",
  instance: "notifications",
  configDir: "ags-notifications",
  mode: "live",
  holdsUnsavedState: false,
}

function readText(...parts) {
  return readFileSync(join(ROOT, ...parts), "utf8")
}

/** Strip comments, keeping strings intact (same shape as ags-apps' gate). */
function stripComments(source) {
  let out = ""
  let state = null
  let i = 0
  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]
    if (state === "line") {
      if (c === "\n") {
        state = null
        out += c
      }
      i += 1
      continue
    }
    if (state === "block") {
      if (c === "*" && next === "/") {
        state = null
        i += 2
      } else {
        i += 1
      }
      continue
    }
    if (state === "'" || state === '"' || state === "`") {
      out += c
      if (c === "\\") {
        out += next ?? ""
        i += 2
        continue
      }
      if (c === state) state = null
      i += 1
      continue
    }
    if (c === "/" && next === "/") {
      state = "line"
      i += 2
      continue
    }
    if (c === "/" && next === "*") {
      state = "block"
      i += 2
      continue
    }
    if (c === "'" || c === '"' || c === "`") state = c
    out += c
    i += 1
  }
  return out
}

/** The `{...}` body of the function named by `marker`, comments stripped. */
function functionBody(source, marker) {
  const clean = stripComments(source)
  const start = clean.indexOf(marker)
  assert.notEqual(start, -1, `missing function marker: ${marker}`)
  const brace = clean.indexOf("{", start)
  assert.notEqual(brace, -1, `missing function body for: ${marker}`)
  let depth = 0
  let state = null
  for (let i = brace; i < clean.length; i += 1) {
    const c = clean[i]
    if (state !== null) {
      if (c === "\\") {
        i += 1
      } else if (c === state) {
        state = null
      }
      continue
    }
    if (c === "'" || c === '"' || c === "`") {
      state = c
      continue
    }
    if (c === "{") depth += 1
    if (c === "}") {
      depth -= 1
      if (depth === 0) return clean.slice(brace + 1, i)
    }
  }
  throw new Error(`unterminated function body: ${marker}`)
}

function findContractsRoot() {
  const override = process.env.CONTRACTS_ROOT
  if (override) return override
  let dir = ROOT
  for (let i = 0; i < 8; i += 1) {
    dir = dirname(dir)
    if (existsSync(join(dir, "contracts", "schemas", "ags-app-manifest.schema.json"))) {
      return join(dir, "contracts")
    }
  }
  return null
}

/** Every authored app-source file, minus generated/local-only trees. */
function walkAppSources(dir = ROOT) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      [
        ".git",
        "node_modules",
        "@girs",
        ".dev",
        ".worktrees",
        "build",
        "dist",
        "contracts",
        "templates",
        "tests",
        "tickets",
      ].includes(entry.name)
    ) {
      continue
    }
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walkAppSources(absolute))
    else if (entry.isFile()) files.push(relative(ROOT, absolute).split("\\").join("/"))
  }
  return files
}

// ── 1. Manifest identity ───────────────────────────────────────────────────

test("the manifest is schema-valid and carries the notifications identity", () => {
  const parsed = parseAgsAppManifest(readText("app.manifest.json"))
  assert.equal(parsed.ok, true, JSON.stringify(parsed.issues ?? []))
  assert.deepEqual(parsed.manifest, IDENTITY)
})

test("the manifest agrees with app.tsx, the window and the stylesheet", () => {
  const app = readText("app.tsx")
  const window = readText("ui", "NotificationsWindow.tsx")
  assert.match(app, /instanceName:\s*"notifications"/)
  assert.match(window, /const WINDOW_NAME = "notifications-window"/)
  assert.match(readText("style.css"), /window#notifications-window/)
})

test("the stylesheet uses palette.v1 roles and no legacy @color_* token", () => {
  const css = readText("style.css")
  assert.doesNotMatch(css, /@color_/, "legacy @color_* token remains in style.css")
  for (const role of ["surface", "on_surface", "primary", "error", "error_container"]) {
    assert.match(css, new RegExp(`@${role}\\b`), `style.css must use @${role}`)
  }
})

test("the launcher and keybind description are documented for consumers", () => {
  const readme = readText("README.md")
  assert.match(readme, /`notifications-ui`/)
  assert.match(readme, /Open notifications/)
  assert.match(readme, /ags-notifications/)
})

test("no app source imports the old monorepo layout", () => {
  // Split so this gate's own source cannot match the pattern it enforces.
  const forbidden = new RegExp(
    "from\\s+[\"'](?:ags-" + "apps|.*src/gui-tools/notifications)",
  )
  const offenders = walkAppSources().filter((file) => forbidden.test(readText(file)))
  assert.deepEqual(offenders, [], `old monorepo import found in: ${offenders.join(", ")}`)
})

// ── 2. Repository template + platform conformance ──────────────────────────

test("the platform template gate passes for this repo", () => {
  const report = checkAppRepoAt(ROOT)
  assert.equal(report.ok, true, formatAppConformanceReport(report, ROOT))
})

test("the frozen copyable template is present for the next app", () => {
  const template = join(ROOT, "templates", "ags-app")
  const required = [
    "AGENTS.md",
    "README.md",
    "Makefile",
    "app.tsx",
    "app.manifest.json",
    "tsconfig.app.json",
    "scripts/worktree-guard.sh",
    "tickets/LIFECYCLE.md",
    "tickets/INDEX.md",
    "tickets/_template/requirement.md",
    "tests/app-contract.test.mjs",
    "tests/unit.test.mjs",
    ".github/workflows/ci.yml",
  ]
  for (const path of required) {
    assert.ok(existsSync(join(template, path)), `templates/ags-app/${path} is missing`)
  }
  for (const token of ["{{APP}}", "{{INSTANCE}}", "{{CONFIG_DIR}}", "{{REPO}}"]) {
    assert.match(
      readText("templates", "ags-app", "template.json"),
      new RegExp(token.replace(/[{}]/g, "\\$&")),
      `template.json must declare ${token}`,
    )
  }
})

test("the contracts v0.12.0 manifest schema agrees with the platform", () => {
  const contractsRoot = findContractsRoot()
  assert.notEqual(contractsRoot, null, "cannot find contracts (set CONTRACTS_ROOT)")
  const schema = JSON.parse(
    readFileSync(join(contractsRoot, "schemas", "ags-app-manifest.schema.json"), "utf8"),
  )
  assert.equal(schema.properties.schemaVersion.const, 1)
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(
    [...schema.required].sort(),
    ["app", "configDir", "holdsUnsavedState", "instance", "mode", "schemaVersion"],
  )
  assert.equal(
    schema.allOf[0].then.properties.holdsUnsavedState.const,
    false,
    "restart stays invalid when holdsUnsavedState is true",
  )
})

test("the Makefile and CI pin platform v1.1.0, contracts v0.12.0 and the local contracts link", () => {
  const makefile = readText("Makefile")
  assert.match(makefile, /^AGS_PLATFORM_VERSION := v1\.1\.0$/m)
  assert.match(makefile, /^CONTRACTS_VERSION := v0\.12\.0$/m)
  assert.match(makefile, /^CONTRACTS_ROOT \?= \$\(CURDIR\)\/\.dev\/contracts$/m)
  assert.doesNotMatch(makefile, /^AGS_PLATFORM_VERSION := v1\.0\.1$/m)

  const workflow = readText(".github", "workflows", "ci.yml")
  assert.match(workflow, /ref: v1\.1\.0/)
  assert.match(workflow, /ref: v0\.12\.0/)
  assert.doesNotMatch(workflow, /ref: v1\.0\.1/)
  assert.doesNotMatch(workflow, /ref: v0\.8\.0|ref: v0\.9\.0|ref: v0\.7\.0/)
})

test("app.tsx consumes the v3 generation plane and no longer applies theme or skin", () => {
  const app = readText("app.tsx")
  assert.match(app, /from\s+"ags-platform\/adapters\/appearance"/)
  assert.match(app, /from\s+"ags-platform\/ports\/appearance-refresh"/)
  assert.match(
    app,
    /const appearance = createAppearance\(\{ configDir: "ags-notifications" \}\)/,
    "the appearance is scoped to this app's configDir",
  )
  assert.doesNotMatch(app, /from\s+"ags-platform\/adapters\/(?:theme|skin)"/)
  assert.doesNotMatch(app, /\b(?:theme|skin)\.apply\(\)/)

  const main = functionBody(app, "main()")
  assert.match(main, /appearance\.apply\(\)/, "main applies the committed generation")
  assert.doesNotMatch(main, /theme\.apply|skin\.apply/)

  const handler = functionBody(app, "requestHandler(argv: string[]")
  assert.match(handler, /APPEARANCE_REFRESH_COMMAND/)
  assert.doesNotMatch(handler, /PALETTE_REFRESH_COMMAND|palette-refresh/)
  assert.doesNotMatch(handler, /theme|skin/)
  assert.equal(
    (app.match(/requestHandler\s*\(/g) ?? []).length,
    1,
    "the app adds no second request handler",
  )

  assert.doesNotMatch(app, /PALETTE_REFRESH_COMMAND|["']palette-refresh["']/)
  assert.doesNotMatch(app, /"ok"\s*:\s*true|ok:\s*true/, "the v2 ok ack is not produced")

  assert.ok(existsSync(join(ROOT, "style.css")), "style.css is still present")
  assert.match(app, /import style from "\.\/style\.css"/)
  assert.match(app, /css: style/)
})

test("the card width comes from the appearance layout token", () => {
  const app = readText("app.tsx")
  assert.match(
    app,
    /appearance\.value\("layout\.ags-notifications\.card-width", 380\)/,
    "the card measure is the v2 layout token with the shipped fallback",
  )

  const window = readText("ui", "NotificationsWindow.tsx")
  assert.doesNotMatch(window, /const CARD_WIDTH\b/, "the hard-coded constant is gone")
  assert.match(window, /cardWidth: ReadAccessor<number>/)
  assert.match(window, /cardWidth\(\)/)
})

// ── 3. The live handler is real and non-destructive ────────────────────────

test("app.tsx registers the v3 generation-bound appearance-refresh handler", () => {
  const app = readText("app.tsx")
  assert.match(app, /createAppearanceRefreshHandler\(appearance,/)
  assert.match(app, /requestHandler\s*\(/)
  assert.match(
    app,
    /if \(argv\[0\] === APPEARANCE_REFRESH_COMMAND\)[\s\S]*appearanceRefresh\(argv, res\)/,
    "appearance-refresh dispatches before the unknown-request response",
  )
  assert.match(
    app,
    /const appearanceRefresh = createAppearanceRefreshHandler\(appearance, \(\) => \{\s*refreshNotificationCardIcons\(\)\s*return \{ status: "applied" \}\s*\}\)/,
    "the app-owned progress-icon work is preserved and reports applied",
  )
  const work = functionBody(app, "const appearanceRefresh = createAppearanceRefreshHandler")
  assert.match(work, /refreshNotificationCardIcons\(\)/)
  assert.match(work, /return \{ status: "applied" \}/, "v3 work returns a generation-bound applied status")
  assert.doesNotMatch(
    work,
    /app\.quit|dismiss|\.remove\(|rebuild|theme\.apply|skin\.apply/,
    "the refresh neither tears down the stack nor re-applies theme/skin",
  )
})

test("the progress-card icon refresh never rebuilds or dismisses a card", () => {
  const window = readText("ui", "NotificationsWindow.tsx")
  const exported = functionBody(window, "export function refreshNotificationCardIcons")
  assert.match(exported, /refreshCardIcons\?\.\(\)/)
  assert.doesNotMatch(exported, /dismiss|remove|quit|rebuild/)

  const iconRefresh = functionBody(window, "function refreshWallpaperIcon")
  assert.match(iconRefresh, /resolveIconPath\("wallpaper-progress", "picture"\)/)
  assert.match(iconRefresh, /set_from_file/)
  assert.doesNotMatch(iconRefresh, /dismiss|\.remove\(|hideWindow|app\.quit/)
})

test("the window keeps consuming the one event client and the progress topics", () => {
  const window = readText("ui", "NotificationsWindow.tsx")
  assert.match(window, /from\s+"ags-platform\/adapters\/event-bus"/)
  assert.match(window, /domainEvents\.subscribe\("wallpaper\.state"/)
  assert.match(window, /domainEvents\.subscribe\("speedtest\.state"/)
  assert.doesNotMatch(window, /from\s+"\.\.\/lib\/(speedtest|wallpaper)-events"/)
  assert.doesNotMatch(window, /theme\.apply/)
})

test("the app still hosts the notification daemon and bus name", () => {
  const app = readText("app.tsx")
  assert.match(app, /NOTIFICATIONS_NAME\s*=\s*"org\.freedesktop\.Notifications"/)
  assert.match(app, /NameHasOwner/)
  assert.match(app, /Notifd\.get_default\(\)/)
})

test("notification cards are opaque (no background bleed-through)", () => {
  const css = readFileSync(join(ROOT, "style.css"), "utf8")
  const block = css.match(/\.notif-card\s*\{([^}]*)\}/)
  assert.ok(block, "style.css must define .notif-card")
  assert.match(block[1], /background-color:\s*@surface\s*;/)
  assert.doesNotMatch(
    block[1],
    /background-color:\s*alpha\(/,
    "notification cards overlay arbitrary windows and must be opaque",
  )
})
