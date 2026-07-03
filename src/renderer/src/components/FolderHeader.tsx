import { useState } from 'react';
import { FolderIcon, PencilIcon, XIcon } from './icons';

interface Props {
  name: string;
  count: number;
  onRename?: (name: string) => void;
  onDelete?: () => void;
}

export default function FolderHeader({
  name,
  count,
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
        <span className="folder-name">
          <FolderIcon /> {name} <span className="folder-count">({count})</span>
        </span>
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
