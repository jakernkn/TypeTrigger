# TypeTrigger

Local macOS menu-bar app that types pre-written text snippets into whatever text
field is currently focused — via a per-snippet global hotkey, or a quick-launch
palette. Built for clean, mistake-free typing during screen recordings.

## Running

```sh
npm install
npm run dev      # dev mode with hot reload
# or
npm run build && npm start
```

The app lives in the menu bar (look for the "T" icon). The dashboard opens on
launch; reopen it any time from the tray menu.

## First-run permissions (important)

TypeTrigger simulates keystrokes, which macOS gates behind
**System Settings → Privacy & Security → Accessibility** (and **Input
Monitoring**, if listed). The dashboard shows a banner until permission is
granted. When running from source, grant the permission to **Electron** — or to
the terminal app you launched it from. Without it, hotkeys fire but nothing
types.

## Usage

- **Dashboard**: snippets appear as compact preview cards in the left sidebar,
  grouped by folder; clicking one (or hitting “+ Snippet”) opens the editor in
  the right pane. Each snippet has a name, text, an optional global hotkey
  (click the hotkey field and press a combo — needs Cmd/Ctrl/Option), a folder,
  and a typing speed. Saving collapses the editor back to the card list.
  Folders are created/renamed/deleted from the sidebar; deleting a folder
  leaves its snippets unfiled.
- **Direct hotkey**: press a snippet's hotkey while focused in any text field —
  the snippet is typed right where you are. This is the most reliable path.
- **Quick palette**: press the palette hotkey (default `⌘⇧Space`) to pop a
  chooser at your cursor. It has two views — **Recent** (newest snippets first)
  and **Folders** — toggled with `Tab`. `↑`/`↓` to navigate, `Enter` to type a
  snippet (or open a folder in the Folders view), `Backspace`/`Esc` to step back
  out of a folder, `Esc` at the top level to dismiss. The palette is
  content-protected: you see it, but screen recordings (Screen Studio,
  QuickTime) and screenshots don't. The first palette selection may prompt for
  Automation ("System Events") permission — allow it; it's used to hand focus
  back to the app you were in.
- **Speed curves**: per snippet, choose Flat / Ease-in / Ease-out / Ease-in-out.
  Curves vary the per-character delay across the snippet (slow start and/or
  finish), which reads more human than a flat delay. Jitter (in Settings) adds
  per-keystroke randomness on top.

Snippets are stored as JSON via `electron-store` in
`~/Library/Application Support/typetrigger/config.json`.

## Stack

Electron + TypeScript + React (via electron-vite), `electron-store` for
persistence, `@nut-tree-fork/nut-js` for keystroke simulation (the maintained
public fork of nut.js — the original `@nut-tree/nut-js` left the public npm
registry).

## Layout

- `src/main/` — app lifecycle, tray, store, IPC, global hotkeys, typing engine,
  palette window + focus restore
- `src/preload/` — `contextBridge` API (`window.api`)
- `src/renderer/` — React dashboard (`index.html`) and palette (`palette.html`)
- `src/shared/types.ts` — `Snippet` / `Settings` types shared across processes

## Out of scope for v1

Windows support, snippet folders, fuzzy palette search, cloud sync, visual
polish. See `TypeTrigger-plan.md` for the original plan.
