import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { Folder, PaletteData, Snippet } from '../../shared/types';
import { FolderIcon } from './components/icons';
import './palette.css';

type View = 'recent' | 'folders';

const UNFILED_ID = '__unfiled__';

interface FolderEntry {
  id: string;
  name: string;
}

function Palette(): React.JSX.Element {
  const [data, setData] = useState<PaletteData>({ snippets: [], folders: [] });
  const [view, setView] = useState<View>('recent');
  const [openFolder, setOpenFolder] = useState<FolderEntry | null>(null);
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Fresh data arrives every time the palette is shown; reset navigation.
    return window.api.onPaletteShow((incoming) => {
      setData(incoming);
      setView('recent');
      setOpenFolder(null);
      setIndex(0);
    });
  }, []);

  const folderIds = new Set(data.folders.map((f) => f.id));
  const unfiled = data.snippets.filter((s) => !s.folderId || !folderIds.has(s.folderId));

  const recentSnippets = [...data.snippets].sort((a, b) => b.createdAt - a.createdAt);

  const folderEntries: FolderEntry[] = [
    ...data.folders.map((f: Folder) => ({ id: f.id, name: f.name })),
    ...(unfiled.length > 0 ? [{ id: UNFILED_ID, name: 'Unfiled' }] : []),
  ];

  const folderSnippets: Snippet[] = openFolder
    ? openFolder.id === UNFILED_ID
      ? unfiled
      : data.snippets.filter((s) => s.folderId === openFolder.id)
    : [];

  // What the list currently shows: snippets (recent or inside a folder) or folders.
  const showingFolders = view === 'folders' && openFolder === null;
  const visibleSnippets = view === 'recent' ? recentSnippets : folderSnippets;
  const itemCount = showingFolders ? folderEntries.length : visibleSnippets.length;

  function toggleView(): void {
    setView((v) => (v === 'recent' ? 'folders' : 'recent'));
    setOpenFolder(null);
    setIndex(0);
  }

  function goBack(): void {
    setOpenFolder(null);
    setIndex(0);
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Tab') {
        e.preventDefault();
        toggleView();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, Math.max(itemCount - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showingFolders) {
          const folder = folderEntries[index];
          if (folder) {
            setOpenFolder(folder);
            setIndex(0);
          }
        } else {
          const selected = visibleSnippets[index];
          if (selected) window.api.paletteSelect(selected.id);
        }
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        if (openFolder) {
          e.preventDefault();
          goBack();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (openFolder) goBack();
        else window.api.paletteHide();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  useEffect(() => {
    listRef.current?.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
  }, [index, view, openFolder]);

  function renderSnippetRow(s: Snippet, i: number): React.JSX.Element {
    return (
      <li
        key={s.id}
        className={i === index ? 'selected' : ''}
        onMouseEnter={() => setIndex(i)}
        onClick={() => window.api.paletteSelect(s.id)}
      >
        <span className="palette-name">{s.name || 'Untitled'}</span>
        <span className="palette-preview">{s.text.slice(0, 40)}</span>
      </li>
    );
  }

  return (
    <div className="palette">
      <div className="palette-tabs">
        <span className={view === 'recent' ? 'active' : ''} onClick={() => view !== 'recent' && toggleView()}>
          Recent
        </span>
        <span className={view === 'folders' ? 'active' : ''} onClick={() => view !== 'folders' && toggleView()}>
          Folders
        </span>
      </div>

      {openFolder && (
        <div className="palette-breadcrumb" onClick={goBack}>
          ‹ {openFolder.name}
        </div>
      )}

      {itemCount === 0 ? (
        <div className="palette-empty">
          {showingFolders
            ? 'No folders yet — create them in the dashboard.'
            : openFolder
              ? 'This folder is empty.'
              : 'No snippets yet — add some in the dashboard.'}
        </div>
      ) : (
        <ul ref={listRef}>
          {showingFolders
            ? folderEntries.map((f, i) => (
                <li
                  key={f.id}
                  className={`palette-folder${i === index ? ' selected' : ''}`}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => {
                    setOpenFolder(f);
                    setIndex(0);
                  }}
                >
                  <span className="palette-name">
                    <FolderIcon className="palette-folder-icon" /> {f.name}
                  </span>
                </li>
              ))
            : visibleSnippets.map(renderSnippetRow)}
        </ul>
      )}

      <div className="palette-hint">
        {openFolder
          ? '↑↓ · ⏎ type · ⌫ back · esc back'
          : showingFolders
            ? 'tab recent · ↑↓ · ⏎ open · esc dismiss'
            : 'tab folders · ↑↓ · ⏎ type · esc dismiss'}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Palette />
  </React.StrictMode>
);
