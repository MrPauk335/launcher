// Fails the build if usage statistics come back.
//
// This fork exists because the launcher used to report how it is used: events to
// api.millida.net, an install id on disk, a heartbeat with the server you play on,
// an uninstall report, and a switch file for the in-game mod. See TELEMETRY.md.
//
// The check is deliberately narrow: it looks for the transport (endpoints), the
// identifiers that made data linkable to an installation, and the core commands
// that fed them. Comments are stripped first, so the documentation that describes
// what was removed does not trip it.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

const FORBIDDEN = [
  ['launcher/telemetry', 'the statistics intake endpoint'],
  ['launcher/heartbeat', 'the "in lobby / in game" pulse'],
  ['launcher/uninstall', 'the uninstall report'],
  ['mod-telemetry', 'the in-game mod summary endpoint'],
  ['compat/signal', 'the mod compatibility signal endpoint'],
  ['m-install-id', 'the persistent install id in localStorage'],
  ['m-telemetry-queue', 'the queue of unsent events'],
  ['remember_install_id', 'the core command that mirrored the install id to disk'],
  ['set_game_telemetry', 'the core command that switched the in-game mod on'],
  ['report_uninstall', 'the core uninstall reporter'],
  ['REPORT_UNINSTALL_ARG', 'the uninstaller argument'],
]

// A mock API table for the browser demo is not a transport: it answers requests
// that never leave the page.
const SKIP = ['src/lib/demo.ts']

const EXT = new Set(['.ts', '.tsx', '.rs', '.mjs', '.js', '.nsh', '.html'])

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'target' || name === 'dist' || name === '.git') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) out.push(path)
  }
  return out
}

/// Drops `//`, `///` and `/* */` comments, keeping line numbers stable.
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, head) => head + ' '.repeat(m.length - head.length))
}

const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'src-tauri', 'src')), join(ROOT, 'src-tauri', 'installer-hooks.nsh')]

const hits = []
for (const file of files) {
  const rel = relative(ROOT, file).replaceAll('\\', '/')
  if (SKIP.includes(rel)) continue
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
  for (const [needle, why] of FORBIDDEN) {
    lines.forEach((line, i) => {
      if (line.includes(needle)) hits.push(`${rel}:${i + 1}  ${why}: ${needle}`)
    })
  }
}

// The switch has to stay dead in the code, not only in the UI.
const core = readFileSync(join(ROOT, 'src/lib/telemetry.ts'), 'utf8')
if (!/export function telemetryEnabled\(\): boolean \{\s*return false\s*\}/.test(core)) {
  hits.push('src/lib/telemetry.ts  telemetryEnabled() no longer returns false unconditionally')
}

if (hits.length) {
  console.error('Статистика вернулась в сборку:\n' + hits.map((h) => '  ' + h).join('\n'))
  console.error('\nСборка без телеметрии не должна содержать эти строки. См. TELEMETRY.md.')
  process.exit(1)
}

console.log(`Телеметрии нет: ${files.length} файлов проверено, ни одного эндпоинта, install id или команды-передатчика.`)
