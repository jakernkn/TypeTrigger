import { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc';
import { getSettings } from './store';
import { typeText } from './typing';

let tray: Tray | null = null;
let dashboardWindow: BrowserWindow | null = null;

const devServerUrl = process.env['ELECTRON_RENDERER_URL'];

function showDashboard(): void {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
    return;
  }

  dashboardWindow = new BrowserWindow({
    width: 920,
    height: 680,
    title: 'TypeTrigger',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
    },
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });

  if (devServerUrl) {
    dashboardWindow.loadURL(`${devServerUrl}/index.html`);
  } else {
    dashboardWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function createTray(): void {
  const iconPath = join(app.getAppPath(), 'resources', 'trayTemplate.png');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('TypeTrigger');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Dashboard', click: showDashboard },
      { type: 'separator' },
      { label: 'Quit TypeTrigger', click: () => app.quit() },
    ])
  );
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', showDashboard);

  app.whenReady().then(() => {
    // Menu-bar app: no Dock icon.
    if (process.platform === 'darwin') app.dock?.hide();
    registerIpcHandlers({ onHotkeysChanged: () => {} });
    createTray();
    showDashboard();

    // TEMPORARY (phase 3): hardcoded hotkey to prove nut-js + Accessibility
    // permission end-to-end. Replaced by store-driven hotkeys in phase 4.
    globalShortcut.register('Command+Alt+T', () => {
      typeText('Hello from TypeTrigger! The typing engine works.', {}, getSettings());
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  // Keep running in the tray when all windows are closed.
  app.on('window-all-closed', () => {});
}
