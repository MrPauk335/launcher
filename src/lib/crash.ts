// Crash and error reports are LOCAL in this build.
//
// Upstream sent them to api.millida.net/v2/errors with the message, the stack and
// the tail of the game log. Here they are only remembered in memory for the
// diagnostics panel (Settings → "Скопировать диагностику"), which the player
// copies by hand. Nothing is uploaded and nothing is written to disk by this
// module.
import { clearCrashes, onCoreFailure, readCrashes } from '../ipc/commands'
import { hasTauri } from '../ipc/tauri'
import type { CrashInfo } from '../ipc/events'
import type { Profile } from '../ipc/commands'

export interface RecentIssue {
  at: number
  kind: 'error' | 'crash'
  text: string
}

const MAX_ISSUES = 20
const ISSUE_TEXT_MAX = 300
const issues: RecentIssue[] = []

function remember(kind: RecentIssue['kind'], text: string) {
  issues.push({ at: Date.now(), kind, text: text.trim().slice(0, ISSUE_TEXT_MAX) })
  if (issues.length > MAX_ISSUES) issues.shift()
}

/** The session's errors, newest last. Read by the diagnostics panel only. */
export function recentIssues(): RecentIssue[] {
  return issues.slice()
}

export interface CrashMeta {
  profile: Profile | null
  ramRequestedMb: number
  nick?: string
}

/** A game crash is kept for the diagnostics text; it is not reported anywhere. */
export async function reportGameCrash(info: CrashInfo, _meta: CrashMeta): Promise<void> {
  if (!info) return
  remember('crash', [info.reason, ...(info.culprits || [])].filter(Boolean).join(' · ') || 'вылет игры')
}

/** A failed core command is kept for the diagnostics text; it is not reported. */
export async function reportCoreFailure(cmd: string, err: unknown, _args?: Record<string, unknown>): Promise<void> {
  remember('error', cmd + ': ' + textOf(err))
}

/** A failed install is kept for the diagnostics text; it is not reported. */
export async function reportInstallFailure(_key: string, title: string, err: unknown): Promise<void> {
  remember('error', (title ? title + ': ' : '') + textOf(err))
}

export async function reportError(where: string, err: unknown, _fatal = false) {
  const e = err instanceof Error ? err : new Error(String(err))
  remember('error', (where ? where + ': ' : '') + (e.name && e.name !== 'Error' ? e.name + ' ' : '') + e.message)
}

function textOf(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string')
    return (err as { message: string }).message
  try {
    return JSON.stringify(err) ?? String(err)
  } catch {
    return String(err)
  }
}

/**
 * Panics and UI freezes the core wrote to its crash folder are shown in the
 * diagnostics text and then deleted from disk. Nothing leaves the machine: the
 * upstream version uploaded the first five of them per launch.
 */
export async function flushNativeCrashes() {
  if (!hasTauri()) return
  try {
    const crashes = await readCrashes()
    if (!crashes.length) return
    for (const c of crashes) remember('crash', c.file + ': ' + c.message)
    await clearCrashes()
  } catch {}
}

export function installErrorHandlers() {
  onCoreFailure(reportCoreFailure)
  window.addEventListener('error', (e) => {
    void reportError('window', e.error || e.message)
  })
  window.addEventListener('unhandledrejection', (e) => {
    void reportError('promise', e.reason)
  })
}
