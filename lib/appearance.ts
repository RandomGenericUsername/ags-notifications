/**
 * The pure core of the notifications app's live appearance refresh (AD-27).
 *
 * The runtime invokes `palette-refresh <appearance-hash>` after the palette
 * pointer moved. The app must converge on the new appearance WITHOUT touching
 * the live notification surface: the open wallpaper/speed-test progress cards,
 * the daemon subscription and the queued notification/bus state all survive.
 *
 * Two separate concerns live here so a stock-runner test can execute them with
 * no `gi://`/`ags` imports:
 *
 * 1. `applyAppearance(surface)` orders the two non-destructive steps the real
 *    v0.5.0 handler performs: re-apply the stable Theme pointer, then re-resolve
 *    the registry-backed progress-card icons. There is deliberately no card
 *    rebuild, dismissal, window hide/show or daemon teardown in this contract.
 * 2. `createAppearanceRefresh(apply)` makes the whole thing idempotent by the
 *    opaque appearance hash: the same hash does no work and still reports
 *    `applied`, while a new hash runs the refresh. A throw is not recorded as
 *    applied, so the runtime's next trigger retries it.
 *
 * PURE: no `ags`, no `gi://*`, no I/O.
 */

/** The two GTK/platform operations the app performs for one appearance. */
export interface NotificationAppearanceSurface {
  /** Re-apply the stable `colors.css` pointer through the Theme port. */
  applyTheme(): void
  /** Replace the progress cards' icons from the current icon manifest. */
  refreshCardIcons(): void
}

/** What the platform's `createPaletteRefreshHandler` accepts as applied. */
export interface AppearanceApplied {
  status: "applied"
}

/**
 * Run the non-destructive appearance refresh in its required order.
 *
 * The Theme pointer is applied BEFORE the icons are re-read: the icons are
 * rendered with the new palette, so resolving them against the old provider
 * state would leave the cards with stale tints. Neither step rebuilds a card,
 * removes one, or touches the AstalNotifd subscription.
 */
export function applyAppearance(surface: NotificationAppearanceSurface): void {
  surface.applyTheme()
  surface.refreshCardIcons()
}

/**
 * Wrap an appearance application as a hash-idempotent refresh.
 *
 * The refresh is opaque to the hash; the app only records which appearance it
 * last applied successfully. Repeated triggers for the same hash are safe and
 * cheap (the runtime ledger retries failures, not successes). A new hash runs
 * the refresh; a failed refresh leaves the previous hash in place so the next
 * trigger retries it.
 */
export function createAppearanceRefresh(
  apply: () => void,
): (appearanceHash: string) => AppearanceApplied {
  let appliedHash: string | null = null

  return (appearanceHash: string): AppearanceApplied => {
    if (appearanceHash !== appliedHash) {
      apply()
      appliedHash = appearanceHash
    }
    return { status: "applied" }
  }
}
