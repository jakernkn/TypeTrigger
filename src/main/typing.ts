import { keyboard, Key } from '@nut-tree-fork/nut-js';
import type { Settings, Snippet, SpeedCurve } from '../shared/types';

// We control pacing ourselves; nut-js must not add its own delay per keystroke.
keyboard.config.autoDelayMs = 0;

export type SpeedOptions = Pick<
  Snippet,
  'typingSpeedMs' | 'speedCurve' | 'minSpeedMs' | 'maxSpeedMs'
>;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

let typing = false;

/** True while a snippet is being typed — used to ignore re-triggers. */
export function isTyping(): boolean {
  return typing;
}

export function curveDelay(t: number, curve: SpeedCurve, min: number, max: number): number {
  // t = normalized position through the snippet, 0..1
  switch (curve) {
    case 'ease-in': // starts slow, ramps up to full speed and holds
      return max - (max - min) * Math.min(t * 2, 1);
    case 'ease-out': // starts at full speed, decelerates toward the end
      return min + (max - min) * Math.max((t - 0.5) * 2, 0);
    case 'ease-in-out': // slow -> fast -> slow (warm up / wind down)
      return max - (max - min) * Math.sin(Math.PI * t);
    default:
      return (min + max) / 2;
  }
}

export async function typeText(
  text: string,
  snippet: SpeedOptions,
  settings: Settings
): Promise<void> {
  if (typing) return;
  typing = true;
  try {
    const base = snippet.typingSpeedMs ?? settings.defaultTypingSpeedMs;
    const curve = snippet.speedCurve ?? 'flat';
    const min = snippet.minSpeedMs ?? base * 0.6;
    const max = snippet.maxSpeedMs ?? base * 1.6;

    const normalized = text.replace(/\r\n/g, '\n');
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (char === '\n') {
        await keyboard.pressKey(Key.Enter);
        await keyboard.releaseKey(Key.Enter);
      } else if (char === '\t') {
        await keyboard.pressKey(Key.Tab);
        await keyboard.releaseKey(Key.Tab);
      } else {
        await keyboard.type(char);
      }

      const t = i / Math.max(normalized.length - 1, 1);
      const delay = curve === 'flat' ? base : curveDelay(t, curve, min, max);
      await sleep(delay + Math.random() * settings.jitterMs);
    }
  } finally {
    typing = false;
  }
}
