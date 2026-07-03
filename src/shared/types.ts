export type SpeedCurve = 'flat' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Snippet {
  id: string;
  name: string;
  text: string;
  hotkey?: string; // Electron accelerator string, e.g. "Command+Alt+1"
  typingSpeedMs?: number; // per-char delay, used when speedCurve is 'flat'
  speedCurve?: SpeedCurve; // default 'flat'
  minSpeedMs?: number; // fastest point of the curve (only used if curve != flat)
  maxSpeedMs?: number; // slowest point of the curve (only used if curve != flat)
  createdAt: number;
}

export type SnippetInput = Omit<Snippet, 'id' | 'createdAt'> & { id?: string };

export interface Settings {
  paletteHotkey: string;
  defaultTypingSpeedMs: number;
  jitterMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  paletteHotkey: 'CommandOrControl+Shift+Space',
  defaultTypingSpeedMs: 25,
  jitterMs: 10,
};
