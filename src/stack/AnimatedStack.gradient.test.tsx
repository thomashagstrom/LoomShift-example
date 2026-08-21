import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme, decomposeColor, getContrastRatio } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { AnimatedStack } from './AnimatedStack';
import {
  DEFAULT_GRADIENT,
  GRADIENT_KEYFRAMES,
  gradientStopColors,
  tintColor,
} from './gradient';
import type { AnimatedStackGradient } from './types';

afterEach(cleanup);

/** Resolves once Framer Motion has had a frame to advance its animations. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The stack's root element — the `<div>` MUI's `Stack` renders. */
const stackRoot = () => screen.getByTestId('stack');

/**
 * The horizontal offset of the gradient, in percent. Framer Motion writes the
 * animated `background-position` to the inline style, so this is the live value
 * of the loop rather than the resting one from `sx`.
 */
const positionX = (element: HTMLElement) => parseFloat(element.style.backgroundPosition);

/**
 * Samples {@link positionX} once per frame for `durationMs`, giving the loop as
 * the browser would paint it.
 */
async function sampleLoop(element: HTMLElement, durationMs: number): Promise<number[]> {
  const samples: number[] = [];
  const startedAt = performance.now();
  while (performance.now() - startedAt < durationMs) {
    samples.push(positionX(element));
    await nextFrame();
  }
  return samples;
}

describe('AnimatedStack gradient background', () => {
  it('paints an animated gradient with nothing but children passed in', async () => {
    render(
      <AnimatedStack data-testid="stack">
        <span>only</span>
      </AnimatedStack>,
    );

    const root = stackRoot();
    const style = getComputedStyle(root);

    // Built from the default theme rather than from colours of its own: every
    // stop is `background.paper` tinted towards a palette channel.
    expect(style.backgroundImage).toMatch(/^linear-gradient\(/);
    gradientStopColors(createTheme(), DEFAULT_GRADIENT).forEach((stop) => {
      expect(style.backgroundImage).toContain(stop);
    });
    // Twice the element's size, so the offset has somewhere to travel.
    expect(style.backgroundSize).toBe('200% 200%');

    // And it is actually moving, not a static gradient.
    const before = positionX(root);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(positionX(root)).not.toBe(before);
  });

  it('closes the loop on the frame it opened with', () => {
    // The whole seamlessness argument in one assertion: the last keyframe is the
    // first, so a cycle can only ever hand over to the next one mid-sweep.
    expect(GRADIENT_KEYFRAMES[GRADIENT_KEYFRAMES.length - 1]).toBe(GRADIENT_KEYFRAMES[0]);
  });

  it('sweeps the full width and keeps going, with no jump at the loop boundary', async () => {
    const loop = 1200;
    render(
      <AnimatedStack data-testid="stack" duration={0} gradientDuration={loop}>
        <span>only</span>
      </AnimatedStack>,
    );

    // A cycle and a quarter, so the sampling window spans a loop boundary.
    const samples = await sampleLoop(stackRoot(), loop * 1.25);

    expect(samples.length).toBeGreaterThan(20);
    // The sweep uses the whole travel: both ends of the gradient are reached.
    expect(Math.min(...samples)).toBeLessThan(5);
    expect(Math.max(...samples)).toBeGreaterThan(95);
    // Nothing jumps. One frame of an eased 1.2s sweep moves a couple of percent;
    // a seam at the loop boundary would show up here as a step of ~100.
    const steps = samples.slice(1).map((value, index) => Math.abs(value - samples[index]));
    expect(Math.max(...steps)).toBeLessThan(40);
    // Still moving after the first cycle has handed over to the second.
    const afterBoundary = samples.slice(-5);
    expect(new Set(afterBoundary).size).toBeGreaterThan(1);
  });

  it('leaves no background of its own with gradient="none"', async () => {
    render(
      <AnimatedStack data-testid="stack" gradient="none">
        <span>only</span>
      </AnimatedStack>,
    );

    const root = stackRoot();
    await nextFrame();

    const style = getComputedStyle(root);
    expect(style.backgroundImage).toBe('');
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(root.style.backgroundPosition).toBe('');
  });

  it('lets a caller sx override the gradient', () => {
    render(
      <AnimatedStack data-testid="stack" sx={{ backgroundImage: 'none' }}>
        <span>only</span>
      </AnimatedStack>,
    );

    // The gradient is composed with the caller's `sx`, not merged over it, so a
    // consumer can always win.
    expect(getComputedStyle(stackRoot()).backgroundImage).toBe('none');
  });

  it('follows the theme it is dropped into', () => {
    const theme = createTheme({ palette: { primary: { main: '#ff0000' } } });
    render(
      <ThemeProvider theme={theme}>
        <AnimatedStack data-testid="stack">
          <span>only</span>
        </AnimatedStack>
      </ThemeProvider>,
    );

    const [firstStop] = gradientStopColors(theme, DEFAULT_GRADIENT);
    expect(firstStop).toBe(tintColor('#fff', '#ff0000', 0.06));
    expect(getComputedStyle(stackRoot()).backgroundImage).toContain(firstStop);
  });
});

/** Every preset, so a contrast check covers the whole surface a caller can pick. */
const PRESETS: Exclude<AnimatedStackGradient, 'none'>[] = ['subtle', 'aurora', 'dusk'];

/** WCAG AA for body text. */
const AA_CONTRAST = 4.5;

/** `text.primary` composited onto an opaque stop — MUI's text colours carry alpha. */
function textOn(theme: Theme, stop: string): string {
  const text = theme.palette.text.primary;
  const { values } = decomposeColor(text);
  return tintColor(stop, text, values[3] ?? 1);
}

describe('AnimatedStack gradient contrast', () => {
  it.each<[string, Theme]>([
    ['light', createTheme({ palette: { mode: 'light' } })],
    ['dark', createTheme({ palette: { mode: 'dark' } })],
  ])('keeps text legible over every stop in the %s theme', (_mode, theme) => {
    PRESETS.forEach((gradient) => {
      const stops = gradientStopColors(theme, gradient);
      expect(stops.length).toBeGreaterThan(1);
      // Checking every stop covers the lightest and the darkest frame of the
      // loop, and everything the sweep passes through in between.
      stops.forEach((stop) => {
        expect(getContrastRatio(textOn(theme, stop), stop)).toBeGreaterThanOrEqual(AA_CONTRAST);
      });
    });
  });

  it('mixes hsl theme colours as readily as hex', () => {
    const theme = createTheme({
      palette: { background: { paper: 'hsl(0, 0%, 100%)' }, primary: { main: 'hsl(0, 100%, 50%)' } },
    });

    expect(gradientStopColors(theme, 'subtle')[0]).toBe(tintColor('#fff', '#ff0000', 0.06));
  });
});
