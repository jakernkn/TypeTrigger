import { ipcMain } from 'electron';
import * as store from './store';
import { getHotkeyErrors } from './hotkeys';
import { hidePalette, selectSnippet } from './palette';
import {
  hasAccessibilityPermission,
  openAccessibilitySettings,
  requestAccessibilityPermission,
} from './permissions';
import type { FolderInput, Settings, SnippetInput } from '../shared/types';

interface IpcHooks {
  /** Called after any change that can affect hotkey registration. */
  onHotkeysChanged: () => void;
}

export function registerIpcHandlers(hooks: IpcHooks): void {
  ipcMain.handle('snippets:get', () => store.getSnippets());

  ipcMain.handle('snippets:save', (_event, input: SnippetInput) => {
    const result = store.saveSnippet(input);
    hooks.onHotkeysChanged();
    return result;
  });

  ipcMain.handle('snippets:delete', (_event, id: string) => {
    const snippets = store.deleteSnippet(id);
    hooks.onHotkeysChanged();
    return snippets;
  });

  // Pure display-order change: hotkeys are unaffected, no re-registration.
  ipcMain.handle('snippets:reorder', (_event, orderedIds: string[]) =>
    store.reorderSnippets(orderedIds)
  );

  ipcMain.handle('folders:get', () => store.getFolders());
  ipcMain.handle('folders:save', (_event, input: FolderInput) => store.saveFolder(input));
  ipcMain.handle('folders:delete', (_event, id: string) => store.deleteFolder(id));

  ipcMain.handle('settings:get', () => store.getSettings());

  ipcMain.handle('settings:save', (_event, settings: Settings) => {
    const saved = store.saveSettings(settings);
    hooks.onHotkeysChanged();
    return saved;
  });

  ipcMain.handle('hotkeys:getErrors', () => getHotkeyErrors());

  ipcMain.handle('palette:select', (_event, id: string) => selectSnippet(id));
  ipcMain.handle('palette:hide', () => hidePalette());

  ipcMain.handle('permissions:check', () => hasAccessibilityPermission());
  ipcMain.handle('permissions:request', () => requestAccessibilityPermission());
  ipcMain.handle('permissions:openSettings', () => openAccessibilitySettings());
}
