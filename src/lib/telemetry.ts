// Usage statistics are REMOVED in this build.
//
// Upstream Millida Launcher collected events about its own operation (app start
// and exit, game launches and crashes, installs, screen views, clicks, searches,
// purchases, hardware profile) and shipped them in batches to
// api.millida.net/v2/launcher/telemetry, keyed by a persistent install id.
// A heartbeat pulse to /launcher/heartbeat reported the game server you were on.
// See TELEMETRY.md in the upstream repository for the original description.
//
// In this fork there is no collector, no queue, no install id, no device block,
// no timer and no HTTP client. The module keeps the same public surface only so
// that the rest of the code stays readable and close to upstream: every entry
// point below is inert and cannot be switched back on from the UI or from
// localStorage. Nothing here touches the network, the disk or `localStorage`.
//
// If you are looking for a call that looks like it reports something: it does
// not. `track()` is a no-op. The endpoints are gone, and
// `scripts/check-no-telemetry.mjs` fails the build if they come back.

/** Kept for the type of `track()`; no event is ever produced in this build. */
export type TelemetryEventType =
  | 'app_start'
  | 'app_exit'
  | 'game_launch'
  | 'game_exit'
  | 'game_crash'
  | 'build_create'
  | 'build_import'
  | 'build_delete'
  | 'content_install'
  | 'content_update'
  | 'modpack_install'
  | 'screen_view'
  | 'server_join'
  | 'skin_apply'
  | 'skin_diag'
  | 'account_link'
  | 'hosting_open'
  | 'pvp_client_open'
  | 'hosting_action'
  | 'rating_open'
  | 'store_open'
  | 'pack_buy_click'
  | 'ui_click'
  | 'impression'
  | 'catalog_search'
  | 'catalog_install'
  | 'mode_open'
  | 'purchase_start'
  | 'purchase_result'
  | 'feedback_send'
  | 'update_applied'
  | 'error'
  | 'perf'
  | 'lag_detected'
  | 'lag_fixed'

/** Statistics are gone from this build; there is nothing to enable. */
export function telemetryEnabled(): boolean {
  return false
}

/** Accepted for source compatibility and ignored: statistics cannot be turned on. */
export function setTelemetryEnabled(_on: boolean): void {}

/** This build has no install id: nothing is ever attributed to an installation. */
export function installId(): string {
  return ''
}

/** Inventory counts used to ride along with every batch; nothing to count now. */
export function setInventory(_buildsCount: number, _modsCount: number): void {}

/** No queue exists, so there is never anything to flush. */
export function flushTelemetry(): Promise<void> {
  return Promise.resolve()
}

export type LiveBeatPayload = {
  installId: string
  status: 'idle' | 'playing'
  os?: string
  appVersion?: string
  locale?: string
  timezone?: string
  build?: string
  mc?: string
  server?: string
}

/** The "in lobby / in game" pulse is removed; there is no payload to build. */
export async function liveBeatPayload(
  _status: 'idle' | 'playing',
  _meta?: { build?: string | null; mc?: string | null; server?: string | null },
  _force = false,
): Promise<LiveBeatPayload | null> {
  return null
}

/** The realtime socket no longer carries an install id. */
export async function realtimeClientInfo(): Promise<{ installId: string | null; version: string; os: string }> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
  const os = ua.includes('win') ? 'windows' : ua.includes('mac') ? 'macos' : 'linux'
  return { installId: null, version: '', os }
}

/** The live pulse is removed. */
export async function liveBeat(
  _status: 'idle' | 'playing',
  _meta?: { build?: string | null; mc?: string | null; server?: string | null },
  _force = false,
): Promise<void> {}

/** No event is recorded. Kept so call sites read the same as upstream. */
export function track(
  _type: TelemetryEventType,
  _data?: Record<string, string | number | boolean>,
  _extra?: { durationMs?: number; ok?: boolean },
): void {}

/** No session length is recorded. */
export function trackAppExit(_opts?: { maybeCancelled?: boolean; flush?: boolean }): void {}

/** Nothing was queued, so nothing has to be taken back. */
export function cancelAppExit(): void {}

/** No duration is measured. */
export function trackTimed(
  _type: TelemetryEventType,
  _startedAt: number,
  _data?: Record<string, string | number | boolean>,
  _ok = true,
): void {}

/** Failure classification is kept: callers use the returned kind to pick a message. */
export function trackFailure(
  _where: string,
  _err: unknown,
  _extra?: Record<string, string | number | boolean | null | undefined>,
): null {
  return null
}

/** Kept for the tests that still import it; there is no state to reset. */
export function __resetTelemetryForTests(): void {}

/** Statistics are removed, so startup has nothing to arm. */
export async function initTelemetry(_bootMs: number): Promise<void> {}
