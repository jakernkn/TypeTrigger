import Store from 'electron-store';
import { randomUUID } from 'crypto';
import { DEFAULT_SETTINGS } from '../shared/types';
import type { Settings, Snippet, SnippetInput } from '../shared/types';

interface StoreSchema {
  snippets: Snippet[];
  settings: Settings;
}

const store = new Store<StoreSchema>({
  defaults: {
    snippets: [],
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

export function saveSnippet(input: SnippetInput): Snippet[] {
  const snippets = getSnippets();
  const index = input.id ? snippets.findIndex((s) => s.id === input.id) : -1;
  if (index >= 0) {
    snippets[index] = compact({ ...snippets[index], ...input, id: snippets[index].id });
  } else {
    snippets.push(compact({ ...input, id: randomUUID(), createdAt: Date.now() }));
  }
  store.set('snippets', snippets);
  return snippets;
}

export function deleteSnippet(id: string): Snippet[] {
  const snippets = getSnippets().filter((s) => s.id !== id);
  store.set('snippets', snippets);
  return snippets;
}

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings') };
}

export function saveSettings(settings: Settings): Settings {
  store.set('settings', settings);
  return settings;
}
