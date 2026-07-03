import { useState } from 'react';
import type { Settings } from '../../../shared/types';
import HotkeyField from './HotkeyField';

interface Props {
  settings: Settings;
  onChanged: (settings: Settings) => void;
}

export default function SettingsPanel({ settings, onChanged }: Props): React.JSX.Element {
  const [draft, setDraft] = useState<Settings>(settings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<Settings>): void {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  }

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const saved = await window.api.saveSettings(draft);
      setDirty(false);
      onChanged(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-panel">
      <h2>Settings</h2>
      <div className="row settings-row">
        <label>
          Palette hotkey{' '}
          <HotkeyField
            value={draft.paletteHotkey || undefined}
            onChange={(hotkey) => update({ paletteHotkey: hotkey ?? '' })}
          />
        </label>
        <label>
          Default speed (ms/char){' '}
          <input
            type="number"
            min={0}
            value={draft.defaultTypingSpeedMs}
            onChange={(e) => update({ defaultTypingSpeedMs: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <label>
          Jitter (ms){' '}
          <input
            type="number"
            min={0}
            value={draft.jitterMs}
            onChange={(e) => update({ jitterMs: Math.max(0, Number(e.target.value)) })}
          />
        </label>
        <button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
        </button>
      </div>
    </section>
  );
}
