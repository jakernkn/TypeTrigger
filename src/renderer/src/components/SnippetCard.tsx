import { useState } from 'react';
import type { Settings, Snippet, SpeedCurve } from '../../../shared/types';
import HotkeyField from './HotkeyField';

interface Props {
  snippet: Snippet;
  settings: Settings;
  warning?: string;
  onChanged: (snippets: Snippet[]) => void;
}

const CURVES: { value: SpeedCurve; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'ease-in', label: 'Ease-in (slow start)' },
  { value: 'ease-out', label: 'Ease-out (slow finish)' },
  { value: 'ease-in-out', label: 'Ease-in-out (slow start & finish)' },
];

export default function SnippetCard({
  snippet,
  settings,
  warning,
  onChanged,
}: Props): React.JSX.Element {
  const [draft, setDraft] = useState<Snippet>(snippet);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<Snippet>): void {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const snippets = await window.api.saveSnippet(draft);
      setDirty(false);
      onChanged(snippets);
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    onChanged(await window.api.deleteSnippet(snippet.id));
  }

  const curve = draft.speedCurve ?? 'flat';
  const base = draft.typingSpeedMs ?? settings.defaultTypingSpeedMs;

  return (
    <div className="snippet-card">
      <div className="row">
        <input
          className="snippet-name"
          type="text"
          value={draft.name}
          placeholder="Snippet name"
          onChange={(e) => update({ name: e.target.value })}
        />
        <HotkeyField value={draft.hotkey} onChange={(hotkey) => update({ hotkey })} />
      </div>

      {warning && <div className="warning">⚠️ {warning}</div>}

      <textarea
        rows={5}
        value={draft.text}
        placeholder="Text to type…"
        onChange={(e) => update({ text: e.target.value })}
      />

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
          Delete
        </button>
      </div>
    </div>
  );
}
