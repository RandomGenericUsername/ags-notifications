# ags-notifications

Standalone AGS notification daemon and top-right notification stack, extracted
from `ags-apps` v0.5.0. The repo root **is** the app package.

| Field | Value |
| --- | --- |
| Repo | `ags-notifications` |
| App id | `notifications` |
| AGS instance | `notifications` |
| Config dir | `ags-notifications` |
| Window | `notifications-window` |
| Launcher | `notifications-ui` |
| Keybind description | Open notifications |
| Manifest mode | `live` (`holdsUnsavedState: false`) |

`app.manifest.json` is the single identity source. The runtime discovers the
deployed config link, requires `manifest.instance == app.tsx instanceName ==
ags list`, and requires `manifest.configDir == the deployed link basename`.

## Runtime contract

### Daemon ownership

The app claims the well-known bus name `org.freedesktop.Notifications` and is
the session notification daemon (AstalNotifd). Before touching AstalNotifd it
asks the bus daemon `NameHasOwner`; a foreign daemon (dunst during a transition,
or a duplicate instance) makes it exit cleanly rather than linger
half-initialised. The bus probe is deliberate: AstalNotifd emits a GLib warning
when the name is taken, and warnings are not catchable.

### Events

The stack consumes the one platform event client
(`ags-platform/adapters/event-bus`) for exactly two contract topics:

- `wallpaper.state` — settles the wallpaper progress card;
- `speedtest.state` — settles the speed-test progress card.

These events are **progress/status only**. They never apply the palette.

### Appearance

`app.tsx` builds one module-level
`createAppearance({ configDir: "ags-notifications" })` and `main()` calls
`appearance.apply()`. The adapter watches the single committed
`$XDG_STATE_HOME/dotfiles/current` generation pointer, verifies
`current/manifest.json`, reads this app's composed
`current/appearance/ags-notifications.css` (palette + skin + mode) and installs
it as the app's one USER-priority provider. A missing artifact is a no-op, so
the bundled `style.css` glass fallback stays in force.

The card width is read from the generation layout token
`layout.ags-notifications.card-width` with the shipped `380` fallback.

### `appearance-refresh`

The runtime invokes `ags request appearance-refresh <genHash> -i notifications`
after a generation is committed. The handler is
`createAppearanceRefreshHandler(appearance, work)`: the platform resolves and
applies the requested generation first, then the app runs its derived work —
re-resolving the registry-backed icons on the progress cards.

Open wallpaper/speed-test progress cards, queued notifications and the
AstalNotifd daemon/bus subscription are preserved — the refresh never rebuilds a
card, dismisses one, hides the stack or restarts the process. The handler is
idempotent by generation hash and answers with exactly one JSON-encoded string
that names the exact requested generation (`{"applied":"<genHash>"}`, or a
generation-bound `deferred`/`failed`), via
`ags-platform/ports/appearance-refresh`. There is no new request command and the
v2 `palette-refresh` / `{"ok":true}` ack is not produced.

## Local development

The platform pin is `ags-platform` `v1.1.0` (the Generations v3 consumer) and
`contracts` is `v0.12.0` (the Generations v3 contract). Those tags are local-only
in this run; the local gates use gitignored symlinks under `.dev/`.

```sh
mkdir -p .dev/ags-platform
ln -s ../../../ags-platform .dev/ags-platform/v1.1.0   # or use AGS_PLATFORM_DEV
ln -s ../../contracts .dev/contracts                   # or set CONTRACTS_ROOT
make test          # pure unit tests (Node only)
make conformance   # manifest + handler + template gate
make drift         # shared event client <-> contracts drift gate
make typecheck     # LOCAL desktop stack: ags + GIR declarations
make bundle        # LOCAL: `ags bundle app.tsx build/ags-notifications.js`
make gates         # all of the above
```

`make test`, `make conformance` and `make drift` are the stock-runner gates.
Typecheck is local and authoritative; CI deliberately has no self-hosted job
(AD-19/AD-23).

Run the app:

```sh
ags run -d .
ags request appearance-refresh <genHash> -i notifications
```

## Repo layout

```text
app.tsx                     AGS entry point (instance notifications, daemon)
app.manifest.json           identity tuple
lib/                        pure card model
ui/                         NotificationsWindow (cards, daemon subscriptions)
tests/                      pure unit + manifest/handler/template conformance
tickets/                    LIFECYCLE, INDEX, _template, this repo's tickets
scripts/worktree-guard.sh
templates/ags-app/          frozen copyable template for the next app repo
.github/workflows/ci.yml    stock-runner CI (make ci)
```

## Creating the next app repo

Copy `templates/ags-app/` to the new repo root, fill the placeholders declared
in `templates/ags-app/template.json`, then run `make test` and
`make conformance`. No generator is required. Keep the template frozen per
release (AD-33).

## Consumer surfaces

`dotfiles-v3` owns the app list; `dotfiles-provision` installs the tag and
links `config/ags-notifications`; `dotfiles-assets` owns the keybind described
as **Open notifications** and the `notifications-ui` launcher. This repo does
not provision or edit those repos; it proves only the app-side contract.
