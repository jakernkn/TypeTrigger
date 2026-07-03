import { useEffect, useState } from 'react';
import type { HotkeyError, Settings, Snippet } from '../../shared/types';
import PermissionBanner from './components/PermissionBanner';
import SnippetCard from './components/SnippetCard';

export default function App(): React.JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hotkeyErrors, setHotkeyErrors] = useState<HotkeyError[]>([]);

  useEffect(() => {
    window.api.getSnippets().then(setSnippets);
    window.api.getSettings().then(setSettings);
    window.api.getHotkeyErrors().then(setHotkeyErrors);
    return window.api.onHotkeyErrors(setHotkeyErrors);
  }, []);

  async function addSnippet(): Promise<void> {
    const updated = await window.api.saveSnippet({ name: 'New snippet', text: '' });
    setSnippets(updated);
  }

  if (!snippets || !settings) return <div className="app">Loading…</div>;

  const paletteError = hotkeyErrors.find((e) => e.snippetId === null);
  const warningFor = (id: string): string | undefined =>
    hotkeyErrors.find((e) => e.snippetId === id)?.reason;

  return (
    <div className="app">
      <PermissionBanner />
      {paletteError && (
        <div className="warning">
          ⚠️ Palette hotkey “{paletteError.hotkey}”: {paletteError.reason}
        </div>
      )}
      <header className="row header-row">
        <h1>TypeTrigger</h1>
        <button type="button" onClick={addSnippet}>
          + Add snippet
        </button>
      </header>

      {snippets.length === 0 ? (
        <p className="empty">
          No snippets yet. Add one, give it a hotkey, and TypeTrigger will type it into
          whatever text field is focused.
        </p>
      ) : (
        snippets.map((s) => (
          <SnippetCard
            key={s.id}
            snippet={s}
            settings={settings}
            warning={warningFor(s.id)}
            onChanged={setSnippets}
          />
        ))
      )}
    </div>
  );
}
