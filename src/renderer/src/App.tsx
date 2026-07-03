import { useEffect, useState } from 'react';
import type { Settings, Snippet } from '../../shared/types';
import SnippetCard from './components/SnippetCard';

export default function App(): React.JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    window.api.getSnippets().then(setSnippets);
    window.api.getSettings().then(setSettings);
  }, []);

  async function addSnippet(): Promise<void> {
    const updated = await window.api.saveSnippet({ name: 'New snippet', text: '' });
    setSnippets(updated);
  }

  if (!snippets || !settings) return <div className="app">Loading…</div>;

  return (
    <div className="app">
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
          <SnippetCard key={s.id} snippet={s} settings={settings} onChanged={setSnippets} />
        ))
      )}
    </div>
  );
}
