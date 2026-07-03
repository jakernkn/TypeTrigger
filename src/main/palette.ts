import { BrowserWindow, screen } from 'electron';
import { execFile } from 'child_process';
import { join } from 'path';
import { getSettings, getSnippets } from './store';
import { isTyping, typeText } from './typing';

const PALETTE_WIDTH = 320;
const PALETTE_HEIGHT = 360;
const FOCUS_SETTLE_MS = 150;

const devServerUrl = process.env['ELECTRON_RENDERER_URL'];

let paletteWindow: BrowserWindow | null = null;
/** Frontmost app captured just before the palette stole focus. */
let previousApp: string | null = null;

function runOsascript(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-e', script], (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

async function captureFrontmostApp(): Promise<string | null> {
  try {
    return await runOsascript(
      'tell application "System Events" to get name of first process whose frontmost is true'
    );
  } catch {
    return null;
  }
}

async function activateApp(name: string): Promise<void> {
  try {
    await runOsascript(`tell application ${JSON.stringify(name)} to activate`);
  } catch {
    // App may have quit since we captured it; typing will go wherever focus is.
  }
}

export function createPaletteWindow(): BrowserWindow {
  if (paletteWindow && !paletteWindow.isDestroyed()) return paletteWindow;

  paletteWindow = new BrowserWindow({
    width: PALETTE_WIDTH,
    height: PALETTE_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  paletteWindow.setAlwaysOnTop(true, 'screen-saver');
  paletteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  paletteWindow.on('blur', hidePalette);
  paletteWindow.on('closed', () => {
    paletteWindow = null;
  });

  if (devServerUrl) {
    paletteWindow.loadURL(`${devServerUrl}/palette.html`);
  } else {
    paletteWindow.loadFile(join(__dirname, '../renderer/palette.html'));
  }

  return paletteWindow;
}

export async function openPalette(): Promise<void> {
  if (isTyping()) return;

  const win = createPaletteWindow();
  if (win.isVisible()) {
    hidePalette();
    return;
  }

  // Capture who has focus BEFORE the palette steals it.
  previousApp = await captureFrontmostApp();

  if (win.webContents.isLoading()) {
    await new Promise<void>((resolve) => win.webContents.once('did-finish-load', () => resolve()));
  }

  const point = screen.getCursorScreenPoint();
  const { workArea } = screen.getDisplayNearestPoint(point);
  const x = Math.max(
    workArea.x,
    Math.min(point.x, workArea.x + workArea.width - PALETTE_WIDTH)
  );
  const y = Math.max(
    workArea.y,
    Math.min(point.y, workArea.y + workArea.height - PALETTE_HEIGHT)
  );
  win.setPosition(Math.round(x), Math.round(y));

  win.webContents.send('palette:show', getSnippets());
  win.show();
  win.focus();
}

export function hidePalette(): void {
  if (paletteWindow && !paletteWindow.isDestroyed() && paletteWindow.isVisible()) {
    paletteWindow.hide();
  }
}

export async function selectSnippet(id: string): Promise<void> {
  // Order matters: hide first, restore focus, let it settle, then type.
  hidePalette();

  const snippet = getSnippets().find((s) => s.id === id);
  if (!snippet) return;

  if (previousApp) await activateApp(previousApp);
  await new Promise((resolve) => setTimeout(resolve, FOCUS_SETTLE_MS));
  await typeText(snippet.text, snippet, getSettings());
}
