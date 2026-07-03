export type SpeedCurve = 'flat' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Snippet {
  id: string;
  name: string;
  text: string;
  folderId?: string; // undefined = unfiled
  hotkey?: string; // Electron accelerator string, e.g. "Command+Alt+1"
  typingSpeedMs?: number; // per-char delay, used when speedCurve is 'flat'
  speedCurve?: SpeedCurve; // default 'flat'
  minSpeedMs?: number; // fastest point of the curve (only used if curve != flat)
  maxSpeedMs?: number; // slowest point of the curve (only used if curve != flat)
  createdAt: number;
}

export type SnippetInput = Omit<Snippet, 'id' | 'createdAt'> & { id?: string };

export interface SaveSnippetResult {
  snippets: Snippet[];
  saved: Snippet;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export type FolderInput = Omit<Folder, 'id' | 'createdAt'> & { id?: string };

export interface DeleteFolderResult {
  folders: Folder[];
  snippets: Snippet[]; // snippets from the deleted folder become unfiled
}

export interface PaletteData {
  snippets: Snippet[];
  folders: Folder[];
}

export interface Settings {
  paletteHotkey: string;
  defaultTypingSpeedMs: number;
  jitterMs: number;
}

export interface HotkeyError {
  snippetId: string | null; // null = the palette hotkey
  hotkey: string;
  reason: string;
}

export const DEFAULT_SETTINGS: Settings = {
  paletteHotkey: 'CommandOrControl+Shift+Space',
  defaultTypingSpeedMs: 25,
  jitterMs: 10,
};
