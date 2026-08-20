import { describe, expect, it } from 'vitest';
import { createTheme, decomposeColor } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { GRADIENT_KEYFRAMES, gradientTints } from './gradient';
import type { AnimatedStackGradient } from './gradient';

/**
 * The gradient is only allowed to exist because it cannot make the content on
 * top of it illegible. That is a property of the colours, not of the markup, so
 * it is checked here in numbers rather than left to a screenshot: every colour
 * the gradient can paint, in both palette modes, against the text colours the
 * theme puts on it.
 */

type Rgb = [number, number, number];

/** Channels plus alpha, parsed with MUI's own colour parser. */
function parse(color: string): { rgb: Rgb; alpha: number } {
  const { values } = decomposeColor(color);
  return { rgb: [values[0], values[1], values[2]], alpha: values[3] ?? 1 };
}

/** Source-over compositing — what the screen ends up showing. */
function over(top: string, bottom: Rgb): Rgb {
  const { rgb, alpha } = parse(top);
  return [0, 1, 2].map((i) => rgb[i] * alpha + bottom[i] * (1 - alpha)) as Rgb;
}

/** Straight sRGB interpolation, as a browser paints between two gradient stops. */
function mix(from: Rgb, to: Rgb, ratio: number): Rgb {
  return [0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * ratio) as Rgb;
}

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** WCAG 2.1 contrast ratio, 1:1 to 21:1. */
function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** AA for body text, and for every heading the library renders (all under 24px). */
const AA_NORMAL_TEXT = 4.5;

/** Endpoints plus the interpolation between them, so no midpoint slips through. */
const SAMPLES = Array.from({ length: 21 }, (_, step) => step / 20);

const MODES: PaletteMode[] = ['light', 'dark'];
const GRADIENTS: AnimatedStackGradient[] = ['subtle', 'brand'];

describe('AnimatedStack gradient contrast', () => {
  it.each(MODES.flatMap((mode) => GRADIENTS.map((gradient) => [mode, gradient] as const)))(
    'keeps text above WCAG AA on every stop of the %s %s gradient',
    (mode, gradient) => {
      const theme = createTheme({ palette: { mode } });
      const paper = parse(theme.palette.background.paper).rgb;

      // The tints are translucent, so what the eye sees is each one composited
      // over the opaque surface the component paints underneath them.
      const [from, to] = gradientTints(theme, gradient).map((tint) => over(tint, paper)) as [
        Rgb,
        Rgb,
      ];

      const texts = [theme.palette.text.primary, theme.palette.text.secondary];

      for (const ratio of SAMPLES) {
        const surface = mix(from, to, ratio);
        for (const text of texts) {
          expect(contrastRatio(over(text, surface), surface)).toBeGreaterThanOrEqual(
            AA_NORMAL_TEXT,
          );
        }
      }
    },
  );

  it('loops back to the frame it started on', () => {
    // The seam is the only place a loop can show a jump, and there is no seam
    // if the last frame is the first one.
    expect(GRADIENT_KEYFRAMES[GRADIENT_KEYFRAMES.length - 1]).toBe(GRADIENT_KEYFRAMES[0]);
    expect(GRADIENT_KEYFRAMES.length).toBeGreaterThan(2);
  });
});
