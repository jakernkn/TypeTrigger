import { ipcMain } from 'electron';
import * as store from './store';
import type { Settings, SnippetInput } from '../shared/types';

interface IpcHooks {
  /** Called after any change that can affect hotkey registration. */
  onHotkeysChanged: () => void;
}

export function registerIpcHandlers(hooks: IpcHooks): void {
  ipcMain.handle('snippets:get', () => store.getSnippets());

  ipcMain.handle('snippets:save', (_event, input: SnippetInput) => {
    const snippets = store.saveSnippet(input);
    hooks.onHotkeysChanged();
    return snippets;
  });

  ipcMain.handle('snippets:delete', (_event, id: string) => {
    const snippets = store.deleteSnippet(id);
    hooks.onHotkeysChanged();
    return snippets;
  });

  ipcMain.handle('settings:get', () => store.getSettings());

  ipcMain.handle('settings:save', (_event, settings: Settings) => {
    const saved = store.saveSettings(settings);
    hooks.onHotkeysChanged();
    return saved;
  });
}
