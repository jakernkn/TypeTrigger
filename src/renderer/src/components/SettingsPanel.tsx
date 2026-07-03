import { useState } from 'react';
import type { Settings } from '../../../shared/types';
import HotkeyField from './HotkeyField';

interface Props {
  settings: Settings;
  onChanged: (settings: Settings) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function SettingsPanel({
  settings,
  onChanged,
  onDirtyChange,
}: Props): React.JSX.Element {
  const [draft, setDraft] = useState<Settings>(settings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<Settings>): void {
    setDraft((d) => ({ ...d, ...patch }));
    if (!dirty) {
      setDirty(true);
      onDirtyChange?.(true);
    }
  }

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const saved = await window.api.saveSettings(draft);
      setDirty(false);
      onDirtyChange?.(false);
      onChanged(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-panel">
      <label className="editor-field">
        Palette hotkey
        <HotkeyField
          value={draft.paletteHotkey || undefined}
          onChange={(hotkey) => update({ paletteHotkey: hotkey ?? '' })}
        />
        <span className="field-hint">Opens the quick palette at your cursor.</span>
      </label>

      <label className="editor-field">
        Default typing speed (ms/char)
        <input
          type="number"
          min={0}
          value={draft.defaultTypingSpeedMs}
          onChange={(e) => update({ defaultTypingSpeedMs: Math.max(0, Number(e.target.value)) })}
        />
        <span className="field-hint">Used by snippets that don't set their own speed.</span>
      </label>

      <label className="editor-field">
        Jitter (ms)
        <input
          type="number"
          min={0}
          value={draft.jitterMs}
          onChange={(e) => update({ jitterMs: Math.max(0, Number(e.target.value)) })}
        />
        <span className="field-hint">Random extra delay per keystroke, for a human feel.</span>
      </label>

      <div className="row">
        <button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
      </div>
    </section>
  );
}
