# TypeTrigger — Implementation Plan

Local macOS menu-bar app that types pre-written text snippets into whatever text
field is currently focused — via a per-snippet global hotkey, or a quick-launch
palette (opens near the cursor, arrow-key nav, Enter to type). Built for clean,
mistake-free typing during screen recordings.

Function over form for v1 — no styling polish needed, just get it working reliably.

## Stack
- Electron + TypeScript + React (renderer)
- `electron-store` for snippet storage (JSON file, not SQLite — this data is a flat
  list, SQLite is unnecessary overhead and adds native-module build friction we don't need)
- `@nut-tree/nut-js` for keystroke simulation — do NOT use `robotjs`, it's
  unmaintained and breaks on current Electron/Node ABI
- macOS only for v1. Requires Accessibility + Input Monitoring permissions
  (System Settings → Privacy & Security) — nut-js and global hotkey capture both need this.

## Data model
```ts
type SpeedCurve = 'flat' | 'ease-in' | 'ease-out' | 'ease-in-out';

interface Snippet {
  id: string;
  name: string;
  text: string;
  hotkey?: string;        // Electron accelerator string, e.g. "CommandOrControl+Alt+1"
  typingSpeedMs?: number; // per-char delay, used when speedCurve is 'flat' (default)
  speedCurve?: SpeedCurve; // default 'flat'
  minSpeedMs?: number;    // fastest point of the curve (only used if curve != flat)
  maxSpeedMs?: number;    // slowest point of the curve (only used if curve != flat)
  createdAt: number;
}

interface Settings {
  paletteHotkey: string;        // default "CommandOrControl+Shift+Space"
  defaultTypingSpeedMs: number; // default 25
  jitterMs: number;             // randomization range, default 10
}
```

## Windows
**1. Dashboard** — normal BrowserWindow, opened from a menu-bar tray icon.
- Snippet list: add/edit/delete, text area per snippet
- Hotkey capture field per snippet (listens for keydown combo, stores as accelerator string)
- Per-snippet speed controls: curve dropdown (Flat / Ease-in / Ease-out / Ease-in-out),
  with min/max speed fields that only appear when curve != Flat
- Settings panel: palette hotkey, default typing speed, jitter

**2. Quick Palette** — frameless, always-on-top, small BrowserWindow.
- Opened via global palette hotkey (default Cmd+Shift+Space)
- Positioned at `screen.getCursorScreenPoint()`
- Renders snippet list, Up/Down to navigate, Enter to select, Esc to dismiss
- On select: hide window, restore focus to the previously-frontmost app, then type

## Focus handling — the part to get right
Two trigger paths behave differently:

- **Direct per-snippet hotkey**: never opens a window, so focus never leaves the
  target text field. Just call the typing engine immediately. This is the simpler,
  more reliable path — prefer it once snippets are set up.
- **Palette path**: opening the palette window steals focus, so it must be restored
  before typing:
  1. Before showing the palette, capture the frontmost app:
     `osascript -e 'tell application "System Events" to get name of first process whose frontmost is true'`
  2. On Enter, hide the palette window first.
  3. Reactivate the captured app: `osascript -e 'tell application "<app>" to activate'`
  4. Wait ~150ms (`setTimeout`) for focus to settle, then call the typing engine.

## Typing engine
Supports a flat per-char delay, or a speed curve across the snippet — slow start
and/or slow finish with a faster middle, which reads as noticeably more human than
flat speed + jitter alone.

```ts
function curveDelay(t: number, curve: SpeedCurve, min: number, max: number): number {
  // t = normalized position through the snippet, 0..1
  switch (curve) {
    case 'ease-in':     // starts slow, ramps up to full speed and holds
      return max - (max - min) * Math.min(t * 2, 1);
    case 'ease-out':    // starts at full speed, decelerates toward the end
      return min + (max - min) * Math.max((t - 0.5) * 2, 0);
    case 'ease-in-out':  // slow -> fast -> slow (warm up / wind down)
      return max - (max - min) * Math.sin(Math.PI * t);
    default:
      return (min + max) / 2;
  }
}

async function typeText(text: string, snippet: Snippet, settings: Settings) {
  const base = snippet.typingSpeedMs ?? settings.defaultTypingSpeedMs;
  const curve = snippet.speedCurve ?? 'flat';
  const min = snippet.minSpeedMs ?? base * 0.6;
  const max = snippet.maxSpeedMs ?? base * 1.6;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '\n') await keyboard.pressKey(Key.Enter);
    else if (char === '\t') await keyboard.pressKey(Key.Tab);
    else await keyboard.type(char);

    const t = i / Math.max(text.length - 1, 1);
    const delay = curve === 'flat' ? base : curveDelay(t, curve, min, max);
    await sleep(delay + Math.random() * settings.jitterMs);
  }
}
```

Easy future extension, not needed for v1: add a fixed pause after spaces/punctuation
(`settings.breakPauseMs`) to mimic the micro-pauses people make between words —
cheap to bolt on later since it's just one more term added to `delay`.

## IPC
`contextBridge` + preload exposing: `getSnippets`, `saveSnippet`, `deleteSnippet`,
`getSettings`, `saveSettings`. Main process owns the store and `globalShortcut`
registration; renderer never touches OS APIs directly.

## Global hotkey registration
- On app start and after any snippet edit: `globalShortcut.unregisterAll()`, then
  re-register palette hotkey + every snippet hotkey from the store.
- Detect duplicate/conflicting accelerators and surface a warning in the UI —
  don't let one silently fail to register.

## Build order (commit after each phase)
1. Electron + TS + React scaffold, tray icon, empty dashboard window opens.
2. Snippet CRUD wired to `electron-store`, dashboard UI works (no hotkeys/typing yet).
3. Typing engine + one hardcoded test hotkey typing a hardcoded string — proves
   nut-js + Accessibility permission flow end-to-end before building UI around it.
4. Wire real per-snippet hotkeys from the store → `globalShortcut` → typing engine.
5. Quick Palette: positioning at cursor, arrow-key nav, Enter/Esc, focus-restore
   logic, then wire to typing engine.
6. Settings screen (palette hotkey, default speed, jitter).

## Explicitly out of scope for v1
- Windows support (nut-js is cross-platform, so porting later is cheap — just not now)
- Snippet folders/categories, fuzzy search in palette
- Cloud sync, multi-device
- Visual polish

## One thing to surface in-app
On first run, detect missing Accessibility/Input Monitoring permission and show a
plain instruction pointing at System Settings, rather than failing silently — this
is the most common source of "it just doesn't do anything" bugs with nut-js.
