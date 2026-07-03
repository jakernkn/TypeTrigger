import type { Snippet } from '../../../shared/types';
import { formatAccelerator } from '../accelerator';

interface Props {
  snippet: Snippet;
  selected: boolean;
  warning?: string;
  onClick: () => void;
}

export default function SnippetListItem({
  snippet,
  selected,
  warning,
  onClick,
}: Props): React.JSX.Element {
  return (
    <div
      className={`snippet-item${selected ? ' selected' : ''}`}
      onClick={onClick}
      title={warning}
    >
      <div className="row snippet-item-top">
        <span className="snippet-item-name">{snippet.name || 'Untitled'}</span>
        {warning && <span className="snippet-item-warning">⚠️</span>}
        {snippet.hotkey && (
          <span className="snippet-item-hotkey">{formatAccelerator(snippet.hotkey)}</span>
        )}
      </div>
      <div className="snippet-item-preview">{snippet.text || 'Empty snippet'}</div>
    </div>
  );
}
