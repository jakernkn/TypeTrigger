import { useState } from 'react';
import { ChevronIcon, FolderIcon, PencilIcon, PlusIcon, XIcon } from './icons';

interface Props {
  name: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  onAddSnippet?: () => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

export default function FolderHeader({
  name,
  count,
  collapsed,
  onToggle,
  onAddSnippet,
  onRename,
  onDelete,
}: Props): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit(): void {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename?.(trimmed);
    else setDraft(name);
  }

  return (
    <div className="row folder-header">
      {editing ? (
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setDraft(name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span className="folder-name" onClick={onToggle}>
          <ChevronIcon size={12} className={`folder-chevron${collapsed ? '' : ' open'}`} />
          <FolderIcon /> {name} <span className="folder-count">({count})</span>
        </span>
      )}
      {!editing && onAddSnippet && (
        <button
          type="button"
          className="mini"
          title="New snippet in this folder"
          onClick={onAddSnippet}
        >
          <PlusIcon size={12} />
        </button>
      )}
      {!editing && onRename && (
        <button type="button" className="mini" title="Rename folder" onClick={() => setEditing(true)}>
          <PencilIcon size={12} />
        </button>
      )}
      {onDelete && (
        <button type="button" className="mini" title="Delete folder (snippets become unfiled)" onClick={onDelete}>
          <XIcon size={12} />
        </button>
      )}
    </div>
  );
}
