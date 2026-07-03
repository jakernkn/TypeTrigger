import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc';

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
  });

  // Keep running in the tray when all windows are closed.
  app.on('window-all-closed', () => {});
}
