import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { Snippet } from '../../shared/types';
import './palette.css';

function Palette(): React.JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Fresh snippet list arrives every time the palette is shown.
    return window.api.onPaletteShow((items) => {
      setSnippets(items);
      setIndex(0);
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, snippets.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = snippets[index];
        if (selected) window.api.paletteSelect(selected.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        window.api.paletteHide();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [snippets, index]);

  useEffect(() => {
    listRef.current
      ?.querySelector('.selected')
      ?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  return (
    <div className="palette">
      <div className="palette-title">TypeTrigger</div>
      {snippets.length === 0 ? (
        <div className="palette-empty">No snippets yet — add some in the dashboard.</div>
      ) : (
        <ul ref={listRef}>
          {snippets.map((s, i) => (
            <li
              key={s.id}
              className={i === index ? 'selected' : ''}
              onMouseEnter={() => setIndex(i)}
              onClick={() => window.api.paletteSelect(s.id)}
            >
              <span className="palette-name">{s.name}</span>
              <span className="palette-preview">{s.text.slice(0, 40)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="palette-hint">↑↓ navigate · ⏎ type · esc dismiss</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Palette />
  </React.StrictMode>
);
