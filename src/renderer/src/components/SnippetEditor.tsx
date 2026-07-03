import { useState } from 'react';
import type {
  SaveSnippetResult,
  Settings,
  Snippet,
  SnippetInput,
  SpeedCurve,
} from '../../../shared/types';
import HotkeyField from './HotkeyField';
import { WarningIcon, XIcon } from './icons';

interface Props {
  snippet: Snippet | null; // null = creating a new snippet
  settings: Settings;
  warning?: string;
  onSaved: (result: SaveSnippetResult) => void;
  onDeleted: (snippets: Snippet[]) => void;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

const CURVES: { value: SpeedCurve; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'ease-in', label: 'Ease-in (slow start)' },
  { value: 'ease-out', label: 'Ease-out (slow finish)' },
  { value: 'ease-in-out', label: 'Ease-in-out (slow start & finish)' },
];

export default function SnippetEditor({
  snippet,
  settings,
  warning,
  onSaved,
  onDeleted,
  onClose,
  onDirtyChange,
}: Props): React.JSX.Element {
  // folderId is deliberately left out of the draft: filing happens by dragging
  // cards onto folders, and a save here must not undo a move made mid-edit.
  const [draft, setDraft] = useState<SnippetInput>(() => {
    if (!snippet) return { name: 'New snippet', text: '' };
    const { folderId: _folderId, createdAt: _createdAt, ...rest } = snippet;
    return rest;
  });
  const [dirty, setDirty] = useState(snippet === null);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<SnippetInput>): void {
    setDraft((d) => ({ ...d, ...patch }));
    if (!dirty) {
      setDirty(true);
      onDirtyChange(true);
    }
  }

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const result = await window.api.saveSnippet({ ...draft, id: snippet?.id });
      setDirty(false);
      onDirtyChange(false);
      onSaved(result);
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (!snippet) {
      onClose();
      return;
    }
    onDeleted(await window.api.deleteSnippet(snippet.id));
  }

  const curve = draft.speedCurve ?? 'flat';
  const base = draft.typingSpeedMs ?? settings.defaultTypingSpeedMs;

  return (
    <div className="editor">
      <div className="row editor-header">
        <h2>{snippet ? 'Edit snippet' : 'New snippet'}</h2>
        <button type="button" className="mini" title="Close editor" onClick={onClose}>
          <XIcon />
        </button>
      </div>

      <label className="editor-field">
        Name
        <input
          type="text"
          value={draft.name}
          placeholder="Snippet name"
          onChange={(e) => update({ name: e.target.value })}
        />
      </label>

      <label className="editor-field">
        Hotkey
        <HotkeyField value={draft.hotkey} onChange={(hotkey) => update({ hotkey })} />
      </label>

      {warning && (
        <div className="warning">
          <WarningIcon /> {warning}
        </div>
      )}

      <label className="editor-field editor-text">
        Text
        <textarea
          rows={12}
          value={draft.text}
          placeholder="Text to type…"
          onChange={(e) => update({ text: e.target.value })}
        />
      </label>

      <div className="row speed-row">
        <label>
          Speed curve{' '}
          <select
            value={curve}
            onChange={(e) => update({ speedCurve: e.target.value as SpeedCurve })}
          >
            {CURVES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {curve === 'flat' ? (
          <label>
            Speed (ms/char){' '}
            <input
              type="number"
              min={0}
              value={draft.typingSpeedMs ?? ''}
              placeholder={String(settings.defaultTypingSpeedMs)}
              onChange={(e) =>
                update({
                  typingSpeedMs: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
        ) : (
          <>
            <label>
              Min (ms/char){' '}
              <input
                type="number"
                min={0}
                value={draft.minSpeedMs ?? ''}
                placeholder={String(Math.round(base * 0.6))}
                onChange={(e) =>
                  update({
                    minSpeedMs: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Max (ms/char){' '}
              <input
                type="number"
                min={0}
                value={draft.maxSpeedMs ?? ''}
                placeholder={String(Math.round(base * 1.6))}
                onChange={(e) =>
                  update({
                    maxSpeedMs: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      <div className="row card-actions">
        <button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
        <button type="button" className="danger" onClick={remove}>
          {snippet ? 'Delete' : 'Discard'}
        </button>
      </div>
    </div>
  );
}
