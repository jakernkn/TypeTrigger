import { globalShortcut } from 'electron';
import { getSettings, getSnippets } from './store';
import { isTyping, typeText } from './typing';
import type { HotkeyError } from '../shared/types';

let lastErrors: HotkeyError[] = [];

export function getHotkeyErrors(): HotkeyError[] {
  return lastErrors;
}

/**
 * Two accelerator strings can name the same key combo in different ways
 * ("Cmd+Alt+1" vs "Alt+Command+1"); normalize before comparing for conflicts.
 */
function normalizeAccelerator(accelerator: string): string {
  const mods: string[] = [];
  let key = '';
  for (const raw of accelerator.split('+')) {
    const part = raw.trim().toLowerCase();
    switch (part) {
      case 'cmd':
      case 'command':
      case 'super':
      case 'meta':
        mods.push('command');
        break;
      case 'cmdorctrl':
      case 'commandorcontrol':
        mods.push(process.platform === 'darwin' ? 'command' : 'control');
        break;
      case 'ctrl':
      case 'control':
        mods.push('control');
        break;
      case 'opt':
      case 'option':
      case 'alt':
        mods.push('alt');
        break;
      case 'shift':
        mods.push('shift');
        break;
      default:
        key = part;
    }
  }
  return [...mods.sort(), key].join('+');
}

/**
 * Drop every registration and rebuild from the store: palette hotkey first,
 * then one hotkey per snippet. Returns the errors so callers can push them
 * to the dashboard.
 */
export function registerAllHotkeys(openPalette: () => void): HotkeyError[] {
  globalShortcut.unregisterAll();

  const errors: HotkeyError[] = [];
  const seen = new Map<string, string>(); // normalized accelerator -> owner label

  function tryRegister(
    accelerator: string,
    snippetId: string | null,
    label: string,
    handler: () => void
  ): void {
    const normalized = normalizeAccelerator(accelerator);
    const conflictOwner = seen.get(normalized);
    if (conflictOwner) {
      errors.push({
        snippetId,
        hotkey: accelerator,
        reason: `Hotkey is also assigned to ${conflictOwner} — only the first one wins`,
      });
      return;
    }
    seen.set(normalized, label);

    let registered = false;
    try {
      registered = globalShortcut.register(accelerator, handler);
    } catch {
      registered = false;
    }
    if (!registered) {
      errors.push({
        snippetId,
        hotkey: accelerator,
        reason: 'Could not register — invalid combo or already taken by another app',
      });
    }
  }

  const settings = getSettings();
  if (settings.paletteHotkey) {
    tryRegister(settings.paletteHotkey, null, 'the quick palette', openPalette);
  }

  for (const snippet of getSnippets()) {
    if (!snippet.hotkey) continue;
    const snippetId = snippet.id;
    tryRegister(snippet.hotkey, snippetId, `snippet “${snippet.name}”`, () => {
      if (isTyping()) return;
      // Re-fetch at fire time so edits since registration are picked up.
      const current = getSnippets().find((s) => s.id === snippetId);
      if (current) typeText(current.text, current, getSettings());
    });
  }

  lastErrors = errors;
  return errors;
}
