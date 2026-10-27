# Telemetry

**This build has none.**

Russian version: [TELEMETRY.ru.md](TELEMETRY.ru.md)

This is **NoTrace Launcher**, a fork of [Millida Launcher](https://github.com/millida/launcher)
under GPL-3.0. The upstream launcher reported how it is used: events about launches,
crashes, installs, clicks and purchases to `api.millida.net/v2/launcher/telemetry`,
tied to a persistent install id, plus an "in lobby / in game" pulse with the server
you were playing on. All of that is gone from this fork.

This file replaces the upstream `TELEMETRY.md`. It lists what was removed, what
still uses the network and why, and how to check the claims yourself.

## What was removed

| Upstream | What it did | Here |
|---|---|---|
| `src/lib/telemetry.ts` | queue in `localStorage`, device block (OS, CPU, RAM, GPU, screen, locale, time zone, instance and mod counts), batch every 2 minutes, flush on hide and exit, `app_start` / `app_exit` | the module is a no-op: no queue, no device block, no install id, no timer, no HTTP client |
| install id (`m-install-id`) | random UUID that joined every event from one installation | does not exist; `installId()` returns an empty string and nothing is stored |
| `liveBeat` / `/launcher/heartbeat` | pulse every 40–50 s with the install id, version, instance, game version and the server you are on | removed; the friends presence request no longer carries a `telemetry` block |
| `src/lib/crash.ts` → `/errors` | message, stack and the tail of the game log, up to 10 per launch | local only: errors are kept in memory for the diagnostics text |
| `src/lib/uiTrack.ts`, `uiClick.ts` | one delegated listener that turned every click into `ui_click`, plus `screen_view` and `impression` | deleted |
| `src/lib/jank.ts` | long-frame measurements per screen | deleted |
| `src/lib/webviewHealth.ts` (heap and screen snapshot) | used JS heap, canvas count and the screen the window died on | deleted; the module now only reads why the window died, to fall back to lighter graphics |
| `src/lib/compatSignal.ts` | "this mod set crashed" votes for the compatibility graph | deleted |
| `src/lib/purchaseTrack.ts` | `purchase_start` / `purchase_result` with product and price | no-op: the helper is kept only because the payment dialogs thread its result |
| `src/lib/importTrack.ts` | failed import events | deleted |
| `OnboardingSurvey` | three questions ("where did you hear about us") | deleted, the onboarding wizard has one step less |
| Settings → "Статистика использования" | the switch that turned the above off | removed: there is nothing to switch |
| `engine/uninstall_report.rs` | the uninstaller ran the launcher with `--report-uninstall` to send the install id | deleted, together with the NSIS hook, the `remember_install_id` command and the `install-id` file |
| `millida_mod.rs` telemetry switch | file `telemetry-off` written only when the player opted out | `game_telemetry_enabled()` is hard-wired to `false`, the file is written at every startup |

## The in-game mod

The Millida mod is still installed into builds: it is what draws skins, capes and
the friends status inside the game. Its own statistics (a session summary to
`/launcher/mod-telemetry` every 15 minutes) are hard-wired off, through both
switches the mod understands:

- `MILLIDA_TELEMETRY=0` in the environment of the game process
  (`src-tauri/src/engine/game/launch.rs`);
- the `telemetry-off` file in the launcher data folder, written at startup
  (`engine/content/millida_mod.rs`, `arm_telemetry_off`).

There is no setting in the interface that can turn it back on.

## What still uses the network

Removing statistics does not make the launcher offline. These requests are the
features themselves:

- **Millida API** (`api.millida.net`): catalog, sign-in, hosting, friends, skins,
  the economy. Without it the launcher shows an empty catalog.
- **Microsoft**: the OAuth sign-in for a licensed account. The password is typed on
  Microsoft's page, never in the launcher.
- **Modrinth, CurseForge, Mojang**: mod, modpack and game file downloads.
- **Friends presence** (`/friends/presence/heartbeat`): only for a signed-in user,
  and only what your friends already see in the list — in the launcher or in game,
  the build and the server you are on.
- **The in-game mod**: the server you join and the friends socket, for the same
  reason.

If you want none of that either, point the build at your own services — the
addresses are in `src/lib/api.ts` and `src-tauri/tauri.conf.json`. Upstream's
`TRADEMARK.md` requires it for any distributed fork anyway.

## Local diagnostics

"Скопировать диагностику" in Settings builds a text with the version, hardware,
builds, Java, the last errors of the session and the panics the core left on disk.
It is assembled in the window and copied to the clipboard: the player decides where
it goes. The core still writes panic and UI-freeze notes to its crash folder; they
are read into that text and deleted.

## Updates are off

The updater points at Millida's release channel and trusts Millida's signing key.
An "update" would replace this build with the official one and switch the
statistics back on, so the check is disabled (`UPDATES_ENABLED` in
`src/lib/updater.ts`). Turn it on together with your own endpoints and your own
public key in `src-tauri/tauri.conf.json`.

## How to check

```bash
node scripts/check-no-telemetry.mjs
```

The script is part of `npm run build:web`. It fails the build if an endpoint, the
install id, the queue key, or a core command that fed them comes back into the
source. Comments are stripped first, so this file does not trip it.

To watch the traffic instead, run the launcher behind mitmproxy: there are no
requests to `/v2/launcher/telemetry`, `/launcher/heartbeat`, `/errors` or
`/v2/launcher/uninstall`.

## What is still Millida's

The code is GPL-3.0, the brand is not. The upstream `TRADEMARK.md` is kept in this
tree: the name, the logo, the icons, the cape and the design images belong to
Millida and are replaced here (a fork must change them). The catalogue art, the
backgrounds and the mascot still come from upstream — replace them before you
publish a build.
