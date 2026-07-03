/** Convert a KeyboardEvent into an Electron accelerator string, or null if the
 *  pressed key can't anchor a global hotkey (bare modifier, unmapped key, or
 *  no non-shift modifier held). */
export function eventToAccelerator(e: KeyboardEvent): string | null {
  const key = codeToAcceleratorKey(e.code);
  if (!key) return null;

  const mods: string[] = [];
  if (e.metaKey) mods.push('Command');
  if (e.ctrlKey) mods.push('Control');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');

  // A global hotkey without Cmd/Ctrl/Alt would fire during ordinary typing.
  if (!e.metaKey && !e.ctrlKey && !e.altKey) return null;

  return [...mods, key].join('+');
}

function codeToAcceleratorKey(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  if (/^Numpad[0-9]$/.test(code)) return 'num' + code.slice(6);

  const named: Record<string, string> = {
    Space: 'Space',
    Enter: 'Enter',
    Tab: 'Tab',
    Backquote: '`',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
  };
  return named[code] ?? null;
}

/** Human-friendly display of an accelerator string using mac symbols. */
export function formatAccelerator(accelerator: string): string {
  return accelerator
    .split('+')
    .map((part) => {
      switch (part) {
        case 'Command':
        case 'CommandOrControl':
        case 'CmdOrCtrl':
          return '⌘';
        case 'Control':
          return '⌃';
        case 'Alt':
        case 'Option':
          return '⌥';
        case 'Shift':
          return '⇧';
        default:
          return part;
      }
    })
    .join('');
}
