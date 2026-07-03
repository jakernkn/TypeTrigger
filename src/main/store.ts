import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { DEFAULT_SETTINGS } from '../shared/types';
import type {
  DeleteFolderResult,
  Folder,
  FolderInput,
  SaveSnippetResult,
  Settings,
  Snippet,
  SnippetInput,
} from '../shared/types';

interface StoreSchema {
  snippets: Snippet[];
  folders: Folder[];
  settings: Settings;
}

const store = new Store<StoreSchema>({
  defaults: {
    snippets: [],
    folders: [],
    settings: DEFAULT_SETTINGS,
  },
});

/** Drop keys explicitly set to undefined so cleared optional fields don't linger. */
function compact<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}

export function getSnippets(): Snippet[] {
  return store.get('snippets');
}

export function saveSnippet(input: SnippetInput): SaveSnippetResult {
  const snippets = getSnippets();
  const index = input.id ? snippets.findIndex((s) => s.id === input.id) : -1;
  let saved: Snippet;
  if (index >= 0) {
    saved = compact({ ...snippets[index], ...input, id: snippets[index].id });
    snippets[index] = saved;
  } else {
    saved = compact({ ...input, id: randomUUID(), createdAt: Date.now() });
    snippets.push(saved);
  }
  store.set('snippets', snippets);
  return { snippets, saved };
}

export function deleteSnippet(id: string): Snippet[] {
  const snippets = getSnippets().filter((s) => s.id !== id);
  store.set('snippets', snippets);
  return snippets;
}

/** Persist a new display order. Ids not present are ignored; stored snippets
 *  missing from the list keep their relative order at the end. */
export function reorderSnippets(orderedIds: string[]): Snippet[] {
  const remaining = new Map(getSnippets().map((s) => [s.id, s]));
  const next: Snippet[] = [];
  for (const id of orderedIds) {
    const snippet = remaining.get(id);
    if (snippet) {
      next.push(snippet);
      remaining.delete(id);
    }
  }
  next.push(...remaining.values());
  store.set('snippets', next);
  return next;
}

export function getFolders(): Folder[] {
  return store.get('folders');
}

export function saveFolder(input: FolderInput): Folder[] {
  const folders = getFolders();
  const index = input.id ? folders.findIndex((f) => f.id === input.id) : -1;
  if (index >= 0) {
    folders[index] = { ...folders[index], ...compact(input), id: folders[index].id };
  } else {
    folders.push({ ...input, id: randomUUID(), createdAt: Date.now() });
  }
  store.set('folders', folders);
  return folders;
}

export function deleteFolder(id: string): DeleteFolderResult {
  const folders = getFolders().filter((f) => f.id !== id);
  store.set('folders', folders);

  const snippets = getSnippets().map((s) => {
    if (s.folderId !== id) return s;
    const { folderId: _dropped, ...rest } = s;
    return rest;
  });
  store.set('snippets', snippets);

  return { folders, snippets };
}

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings') };
}

export function saveSettings(settings: Settings): Settings {
  store.set('settings', settings);
  return settings;
}
