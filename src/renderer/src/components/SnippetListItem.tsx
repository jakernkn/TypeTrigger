import { useState } from 'react';
import type { Snippet } from '../../../shared/types';
import { formatAccelerator } from '../accelerator';
import { SNIPPET_DRAG_TYPE } from '../dnd';
import { WarningIcon } from './icons';

export type DropEdge = 'top' | 'bottom';

interface Props {
  snippet: Snippet;
  selected: boolean;
  warning?: string;
  dragging: boolean; // this card is the current drag source
  onClick: () => void;
  onDragStartSnippet: (id: string) => void;
  onDragEndSnippet: () => void;
  /** A card was dropped onto this one: insert it above or below. */
  onDropSnippet: (draggedId: string, edge: DropEdge) => void;
}

export default function SnippetListItem({
  snippet,
  selected,
  warning,
  dragging,
  onClick,
  onDragStartSnippet,
  onDragEndSnippet,
  onDropSnippet,
}: Props): React.JSX.Element {
  const [dropEdge, setDropEdge] = useState<DropEdge | null>(null);

  const classes = [
    'snippet-item',
    selected ? 'selected' : '',
    dragging ? 'dragging' : '',
    dropEdge === 'top' ? 'drop-above' : '',
    dropEdge === 'bottom' ? 'drop-below' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      title={warning}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(SNIPPET_DRAG_TYPE, snippet.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStartSnippet(snippet.id);
      }}
      onDragEnd={() => {
        setDropEdge(null);
        onDragEndSnippet();
      }}
      onDragOver={(e) => {
        if (dragging || !e.dataTransfer.types.includes(SNIPPET_DRAG_TYPE)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        setDropEdge(e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom');
      }}
      onDragLeave={() => setDropEdge(null)}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes(SNIPPET_DRAG_TYPE)) return;
        e.preventDefault();
        e.stopPropagation(); // the folder section must not also handle this drop
        const draggedId = e.dataTransfer.getData(SNIPPET_DRAG_TYPE);
        const edge = dropEdge ?? 'bottom';
        setDropEdge(null);
        if (draggedId && draggedId !== snippet.id) onDropSnippet(draggedId, edge);
      }}
    >
      <div className="row snippet-item-top">
        <span className="snippet-item-name">{snippet.name || 'Untitled'}</span>
        {warning && (
          <span className="snippet-item-warning">
            <WarningIcon />
          </span>
        )}
        {snippet.hotkey && (
          <span className="snippet-item-hotkey">{formatAccelerator(snippet.hotkey)}</span>
        )}
      </div>
      <div className="snippet-item-preview">{snippet.text || 'Empty snippet'}</div>
    </div>
  );
}
