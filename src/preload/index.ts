import { contextBridge, ipcRenderer } from 'electron';
import type { Settings, Snippet, SnippetInput } from '../shared/types';

const api = {
  getSnippets: (): Promise<Snippet[]> => ipcRenderer.invoke('snippets:get'),
  saveSnippet: (snippet: SnippetInput): Promise<Snippet[]> =>
    ipcRenderer.invoke('snippets:save', snippet),
  deleteSnippet: (id: string): Promise<Snippet[]> => ipcRenderer.invoke('snippets:delete', id),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Settings): Promise<Settings> =>
    ipcRenderer.invoke('settings:save', settings),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
