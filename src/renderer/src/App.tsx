import { useEffect, useState } from 'react';
import type { Folder, HotkeyError, Settings, Snippet } from '../../shared/types';
import FolderHeader from './components/FolderHeader';
import PermissionBanner from './components/PermissionBanner';
import SettingsPanel from './components/SettingsPanel';
import SnippetEditor from './components/SnippetEditor';
import SnippetListItem, { type DropEdge } from './components/SnippetListItem';
import { ArrowLeftIcon, GearIcon, WarningIcon } from './components/icons';
import { SNIPPET_DRAG_TYPE } from './dnd';

export default function App(): React.JSX.Element {
  const [snippets, setSnippets] = useState<Snippet[] | null>(null);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hotkeyErrors, setHotkeyErrors] = useState<HotkeyError[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFolderId, setNewFolderId] = useState<string | undefined>(undefined);
  const [editorDirty, setEditorDirty] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'snippets' | 'settings'>('snippets');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('collapsedFolders') ?? '[]'));
    } catch {
      return new Set();
    }
  });

  function toggleCollapsed(key: string): void {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem('collapsedFolders', JSON.stringify([...next]));
      return next;
    });
  }

  useEffect(() => {
    window.api.getSnippets().then(setSnippets);
    window.api.getFolders().then(setFolders);
    window.api.getSettings().then(setSettings);
    window.api.getHotkeyErrors().then(setHotkeyErrors);
    return window.api.onHotkeyErrors(setHotkeyErrors);
  }, []);

  if (!snippets || !folders || !settings) return <div className="app">Loading…</div>;

  const paletteError = hotkeyErrors.find((e) => e.snippetId === null);
  const warningFor = (id: string): string | undefined =>
    hotkeyErrors.find((e) => e.snippetId === id)?.reason;

  function confirmDiscard(): boolean {
    return !editorDirty || window.confirm('Discard unsaved changes?');
  }

  function openSnippet(id: string): void {
    if (id === selectedId && !creating) return;
    if (!confirmDiscard()) return;
    setCreating(false);
    setSelectedId(id);
    setEditorDirty(false);
  }

  function openNew(folderId?: string): void {
    if (!confirmDiscard()) return;
    setSelectedId(null);
    setCreating(true);
    setNewFolderId(folderId);
    setEditorDirty(false);
    // Expand the target folder so the new card is visible once saved.
    if (folderId && collapsed.has(folderId)) toggleCollapsed(folderId);
  }

  function closeEditor(): void {
    setSelectedId(null);
    setCreating(false);
    setEditorDirty(false);
  }

  async function addFolder(): Promise<void> {
    setFolders(await window.api.saveFolder({ name: 'New folder' }));
  }

  async function renameFolder(id: string, name: string): Promise<void> {
    setFolders(await window.api.saveFolder({ id, name }));
  }

  async function removeFolder(id: string): Promise<void> {
    const result = await window.api.deleteFolder(id);
    setFolders(result.folders);
    setSnippets(result.snippets);
  }

  async function moveSnippet(snippetId: string, folderId: string | undefined): Promise<void> {
    const snippet = snippets?.find((s) => s.id === snippetId);
    if (!snippet || snippet.folderId === folderId) return;
    const result = await window.api.saveSnippet({ ...snippet, folderId });
    // Send it to the end of the flat list so it lands at the bottom of its
    // new group rather than at some arbitrary position.
    const ids = result.snippets.map((s) => s.id).filter((id) => id !== snippetId);
    ids.push(snippetId);
    setSnippets(await window.api.reorderSnippets(ids));
  }

  /** A card was dropped onto another card: put it above/below the target,
   *  moving it into the target's folder first if they differ. */
  async function reorderDrop(draggedId: string, targetId: string, edge: DropEdge): Promise<void> {
    if (!snippets || draggedId === targetId) return;
    const dragged = snippets.find((s) => s.id === draggedId);
    const target = snippets.find((s) => s.id === targetId);
    if (!dragged || !target) return;

    // A dangling folderId (folder deleted) renders in Unfiled; normalize so
    // the dragged card joins the group the user actually sees.
    const ids = new Set(folders?.map((f) => f.id));
    const targetFolderId =
      target.folderId && ids.has(target.folderId) ? target.folderId : undefined;

    let list = snippets;
    if (dragged.folderId !== targetFolderId) {
      list = (await window.api.saveSnippet({ ...dragged, folderId: targetFolderId })).snippets;
    }

    const order = list.map((s) => s.id).filter((id) => id !== draggedId);
    const insertAt = order.indexOf(targetId) + (edge === 'bottom' ? 1 : 0);
    order.splice(insertAt, 0, draggedId);
    setSnippets(await window.api.reorderSnippets(order));
  }

  /** Drag-over highlight + drop handling for a folder group (or Unfiled). */
  function dropTargetProps(
    key: string,
    folderId: string | undefined
  ): React.HTMLAttributes<HTMLElement> {
    return {
      onDragOver: (e) => {
        if (!e.dataTransfer.types.includes(SNIPPET_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverKey(key);
      },
      onDragLeave: (e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverKey((k) => (k === key ? null : k));
      },
      onDrop: (e) => {
        e.preventDefault();
        setDragOverKey(null);
        const snippetId = e.dataTransfer.getData(SNIPPET_DRAG_TYPE);
        if (snippetId) moveSnippet(snippetId, folderId);
      },
    };
  }

  const selected = snippets.find((s) => s.id === selectedId) ?? null;
  const editorOpen = creating || selected !== null;

  const folderIds = new Set(folders.map((f) => f.id));
  const unfiled = snippets.filter((s) => !s.folderId || !folderIds.has(s.folderId));

  function renderItems(items: Snippet[]): React.JSX.Element[] {
    return items.map((s) => (
      <SnippetListItem
        key={s.id}
        snippet={s}
        selected={s.id === selectedId && !creating}
        warning={warningFor(s.id)}
        dragging={draggingId === s.id}
        onClick={() => openSnippet(s.id)}
        onDragStartSnippet={setDraggingId}
        onDragEndSnippet={() => {
          setDraggingId(null);
          setDragOverKey(null);
        }}
        onDropSnippet={(draggedId, edge) => reorderDrop(draggedId, s.id, edge)}
      />
    ));
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <PermissionBanner />
        {paletteError && (
          <div className="warning">
            <WarningIcon /> Palette hotkey “{paletteError.hotkey}”: {paletteError.reason}
          </div>
        )}

        {sidebarView === 'settings' ? (
          <>
            <header className="row header-row">
              <div className="row">
                <button
                  type="button"
                  className="mini"
                  title="Back to snippets"
                  onClick={() => {
                    if (!settingsDirty || window.confirm('Discard unsaved settings?')) {
                      setSettingsDirty(false);
                      setSidebarView('snippets');
                    }
                  }}
                >
                  <ArrowLeftIcon size={16} />
                </button>
                <h1>Settings</h1>
              </div>
            </header>
            <SettingsPanel
              settings={settings}
              onChanged={setSettings}
              onDirtyChange={setSettingsDirty}
            />
          </>
        ) : (
          <>
        <header className="row header-row">
          <h1>TypeTrigger</h1>
          <div className="row">
            <button type="button" onClick={addFolder}>
              + Folder
            </button>
            <button type="button" onClick={() => openNew()}>
              + Snippet
            </button>
            <button
              type="button"
              className="mini"
              title="Settings"
              onClick={() => setSidebarView('settings')}
            >
              <GearIcon size={16} />
            </button>
          </div>
        </header>

        {snippets.length === 0 && folders.length === 0 && (
          <p className="empty">
            No snippets yet. Add one, give it a hotkey, and TypeTrigger will type it into
            whatever text field is focused.
          </p>
        )}

        {folders.map((folder) => {
          const items = snippets.filter((s) => s.folderId === folder.id);
          const isCollapsed = collapsed.has(folder.id);
          return (
            <section
              key={folder.id}
              className={`folder-group${dragOverKey === folder.id ? ' drop-target' : ''}`}
              {...dropTargetProps(folder.id, folder.id)}
            >
              <FolderHeader
                name={folder.name}
                count={items.length}
                collapsed={isCollapsed}
                onToggle={() => toggleCollapsed(folder.id)}
                onAddSnippet={() => openNew(folder.id)}
                onRename={(name) => renameFolder(folder.id, name)}
                onDelete={() => {
                  if (
                    items.length === 0 ||
                    window.confirm(
                      `Delete folder “${folder.name}”? Its ${items.length} snippet(s) become unfiled.`
                    )
                  ) {
                    removeFolder(folder.id);
                  }
                }}
              />
              <div className={`folder-body${isCollapsed ? ' collapsed' : ''}`}>
                <div className="folder-body-inner">
                  {items.length === 0 && <div className="drop-hint">Drag snippets here</div>}
                  {renderItems(items)}
                </div>
              </div>
            </section>
          );
        })}

        {(unfiled.length > 0 || folders.length > 0) && (
          <section
            className={`folder-group${dragOverKey === 'unfiled' ? ' drop-target' : ''}`}
            {...dropTargetProps('unfiled', undefined)}
          >
            <FolderHeader
              name="Unfiled"
              count={unfiled.length}
              collapsed={collapsed.has('unfiled')}
              onToggle={() => toggleCollapsed('unfiled')}
            />
            <div className={`folder-body${collapsed.has('unfiled') ? ' collapsed' : ''}`}>
              <div className="folder-body-inner">
                {unfiled.length === 0 && (
                  <div className="drop-hint">Drag snippets here to unfile</div>
                )}
                {renderItems(unfiled)}
              </div>
            </div>
          </section>
        )}
          </>
        )}
      </div>

      <div className="main-pane">
        {editorOpen ? (
          <SnippetEditor
            key={creating ? `new:${newFolderId ?? ''}` : selectedId}
            snippet={selected}
            newFolderId={creating ? newFolderId : undefined}
            newFolderName={
              creating && newFolderId
                ? folders.find((f) => f.id === newFolderId)?.name
                : undefined
            }
            settings={settings}
            warning={selected ? warningFor(selected.id) : undefined}
            onSaved={(result) => {
              setSnippets(result.snippets);
              closeEditor();
            }}
            onDeleted={(updated) => {
              setSnippets(updated);
              closeEditor();
            }}
            onClose={() => {
              if (confirmDiscard()) closeEditor();
            }}
            onDirtyChange={setEditorDirty}
          />
        ) : (
          <div className="editor-empty">
            Select a snippet to edit it,
            <br />
            or hit “+ Snippet” to create one.
          </div>
        )}
      </div>
    </div>
  );
}
