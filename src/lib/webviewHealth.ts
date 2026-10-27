// Health of the launcher window (WebView): why the previous one died and how to
// give memory back to the game.
//
// The upstream version also sampled the JS heap once a minute and wrote the
// current screen to localStorage so a later launch could report what the dead
// window was showing. Both existed only to build a telemetry event, so they are
// gone. What is left is local: the core records why the render process went away,
// this module reads that record to fall back to lighter graphics and to tell the
// player what happened.
import { noteGpuProcessExit } from './gpuLite'
import { hasTauri } from '../ipc/tauri'
import { setWebviewLowMemory, takeWebviewFailure } from '../ipc/commands'
import { showToast } from '../state/ui'
import { t } from '../i18n'

let failure: ReturnType<typeof takeWebviewFailure> | null = null
let liteAfterFailure = false

/** The reason the previous window died is taken once, as early as possible:
 *  a graphics failure has to switch WebGL off before the lobby creates it. */
export function webviewFailure(): ReturnType<typeof takeWebviewFailure> {
  if (!failure) {
    const taken = hasTauri() ? takeWebviewFailure().catch(() => null) : Promise.resolve(null)
    failure = taken.then((f) => {
      if (f && f.kind === 'gpu') liteAfterFailure = noteGpuProcessExit()
      return f
    })
  }
  return failure
}

/** Tells the player the window restarted and why. Nothing is reported anywhere. */
export async function reportWebviewFailure(): Promise<void> {
  if (!hasTauri()) return
  const f = await webviewFailure()
  if (!f) return
  if (f.reason === 'out_of_memory') {
    showToast(t('Машине не хватило памяти — окно лаунчера перезапустилось само. Уменьши память сборке или закрой лишние программы'), 'error')
    return
  }
  if (f.kind === 'gpu' && liteAfterFailure) {
    showToast(t('Видеокарта сбросила окно — включили лёгкую графику без 3D'), 'error')
    return
  }
  showToast(t('Окно лаунчера подвисло и перезапустилось само'), 'error')
}

/// Called around the game, when the machine is tightest: out of sight the webview
/// gives its caches back instead of competing with the game for RAM.
export function setLauncherIdleMemory(on: boolean): void {
  if (!hasTauri()) return
  void setWebviewLowMemory(on).catch(() => {})
}
