import { contextBridge, ipcRenderer } from 'electron';
import type {
  DeleteFolderResult,
  Folder,
  FolderInput,
  HotkeyError,
  PaletteData,
  SaveSnippetResult,
  Settings,
  Snippet,
  SnippetInput,
} from '../shared/types';

const api = {
  getSnippets: (): Promise<Snippet[]> => ipcRenderer.invoke('snippets:get'),
  saveSnippet: (snippet: SnippetInput): Promise<SaveSnippetResult> =>
    ipcRenderer.invoke('snippets:save', snippet),
  deleteSnippet: (id: string): Promise<Snippet[]> => ipcRenderer.invoke('snippets:delete', id),
  reorderSnippets: (orderedIds: string[]): Promise<Snippet[]> =>
    ipcRenderer.invoke('snippets:reorder', orderedIds),
  getFolders: (): Promise<Folder[]> => ipcRenderer.invoke('folders:get'),
  saveFolder: (folder: FolderInput): Promise<Folder[]> =>
    ipcRenderer.invoke('folders:save', folder),
  deleteFolder: (id: string): Promise<DeleteFolderResult> =>
    ipcRenderer.invoke('folders:delete', id),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Settings): Promise<Settings> =>
    ipcRenderer.invoke('settings:save', settings),
  getHotkeyErrors: (): Promise<HotkeyError[]> => ipcRenderer.invoke('hotkeys:getErrors'),
  onPaletteShow: (callback: (data: PaletteData) => void): (() => void) => {
    const listener = (_event: unknown, data: PaletteData): void => callback(data);
    ipcRenderer.on('palette:show', listener);
    return () => ipcRenderer.removeListener('palette:show', listener);
  },
  paletteSelect: (id: string): Promise<void> => ipcRenderer.invoke('palette:select', id),
  paletteHide: (): Promise<void> => ipcRenderer.invoke('palette:hide'),
  onHotkeyErrors: (callback: (errors: HotkeyError[]) => void): (() => void) => {
    const listener = (_event: unknown, errors: HotkeyError[]): void => callback(errors);
    ipcRenderer.on('hotkeys:errors', listener);
    return () => ipcRenderer.removeListener('hotkeys:errors', listener);
  },
  checkAccessibility: (): Promise<boolean> => ipcRenderer.invoke('permissions:check'),
  requestAccessibility: (): Promise<boolean> => ipcRenderer.invoke('permissions:request'),
  openAccessibilitySettings: (): Promise<void> => ipcRenderer.invoke('permissions:openSettings'),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
