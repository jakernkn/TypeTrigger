import { useEffect, useRef, useState } from 'react';
import { eventToAccelerator, formatAccelerator } from '../accelerator';

interface Props {
  value?: string;
  onChange: (accelerator: string | undefined) => void;
}

export default function HotkeyField({ value, onChange }: Props): React.JSX.Element {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!recording) return;

    const onKeyDown = (e: KeyboardEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setRecording(false);
        return;
      }
      if (e.code === 'Backspace' || e.code === 'Delete') {
        onChange(undefined);
        setRecording(false);
        return;
      }
      const accelerator = eventToAccelerator(e);
      if (accelerator) {
        onChange(accelerator);
        setRecording(false);
      }
    };

    const stop = (): void => setRecording(false);
    window.addEventListener('keydown', onKeyDown, true);
    buttonRef.current?.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      buttonRef.current?.removeEventListener('blur', stop);
    };
  }, [recording, onChange]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`hotkey-field${recording ? ' recording' : ''}`}
      title="Needs at least one of Cmd/Ctrl/Option. Backspace clears, Esc cancels."
      onClick={() => setRecording(true)}
    >
      {recording
        ? 'Press keys…'
        : value
          ? formatAccelerator(value)
          : 'Click to record hotkey'}
    </button>
  );
}
