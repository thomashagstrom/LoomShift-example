import { describe, expect, it } from 'vitest';
import {
  createTheme,
  decomposeColor,
  getContrastRatio,
  recomposeColor,
} from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import {
  GRADIENT_KEYFRAMES,
  GRADIENT_REST,
  GRADIENT_TRANSITION,
  buildGradientStops,
  buildGradientSx,
} from './gradient';

/** WCAG AA for body-sized text. */
const AA_RATIO = 4.5;

/**
 * Paint a translucent colour onto the opaque one behind it and return what the
 * eye ends up seeing. Both the gradient stops and MUI's text colours are
 * translucent by design, and a contrast ratio can only be read off opaque
 * colours — so each one is flattened onto its own backdrop first.
 */
function flatten(overlay: string, base: string): string {
  const [red, green, blue, opacity = 1] = decomposeColor(overlay).values;
  const backdrop = decomposeColor(base).values;

  return recomposeColor({
    type: 'rgb',
    values: [
      Math.round(red * opacity + backdrop[0] * (1 - opacity)),
      Math.round(green * opacity + backdrop[1] * (1 - opacity)),
      Math.round(blue * opacity + backdrop[2] * (1 - opacity)),
    ],
  });
}

const THEMES: [string, Theme][] = [
  ['light', createTheme({ palette: { mode: 'light' } })],
  ['dark', createTheme({ palette: { mode: 'dark' } })],
];

describe('the AnimatedStack gradient', () => {
  it('loops back to the frame it started on', () => {
    // The seam is the whole risk of a looping background: the pan has to arrive
    // where it began, or the repeat reads as a jump.
    expect(GRADIENT_KEYFRAMES.length).toBeGreaterThan(1);
    expect(GRADIENT_KEYFRAMES[GRADIENT_KEYFRAMES.length - 1]).toBe(GRADIENT_KEYFRAMES[0]);
    expect(GRADIENT_TRANSITION.repeat).toBe(Infinity);
  });

  it('rests on the frame the pan starts from', () => {
    // So a motion-free stack shows the same surface the animated one opens on,
    // rather than a second, differently-tinted variant of it.
    expect(GRADIENT_REST).toBe(GRADIENT_KEYFRAMES[0]);
  });

  it('takes its colours from the theme palette', () => {
    const theme = createTheme({
      palette: { primary: { main: '#ff0000' }, secondary: { main: '#0000ff' } },
    });

    const surface = buildGradientSx(theme);
    expect(surface.backgroundImage).toContain('rgba(255, 0, 0');
    expect(surface.backgroundImage).toContain('rgba(0, 0, 255');
    // Painted over an opaque base, so the tints composite against a known
    // colour instead of whatever happens to be behind the stack.
    expect(surface.backgroundColor).toBe(theme.palette.background.paper);
    expect(surface.backgroundPosition).toBe(GRADIENT_REST);
  });

  describe.each(THEMES)('in the %s theme', (_mode, theme) => {
    const paper = theme.palette.background.paper;
    // Every stop, which covers the lightest and the darkest frame of the loop:
    // the sweep only ever shows colours between them.
    const stops = buildGradientStops(theme).map((stop) => flatten(stop, paper));
    const text: [string, string][] = [
      ['text.primary', theme.palette.text.primary],
      ['text.secondary', theme.palette.text.secondary],
    ];

    it.each(text)('keeps %s legible over every gradient stop', (_name, color) => {
      for (const surface of stops) {
        expect(getContrastRatio(flatten(color, surface), surface)).toBeGreaterThanOrEqual(AA_RATIO);
      }
    });
  });
});
