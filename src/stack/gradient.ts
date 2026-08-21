import { decomposeColor, hslToRgb, recomposeColor } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { Transition as MotionTransitionConfig } from 'framer-motion';
import { DEFAULT_EASING } from '../shared/animation';
import type { AnimatedStackGradient } from './types';

/**
 * The animated gradient background {@link AnimatedStack} paints on itself.
 *
 * Every stop is derived from the theme — the surface colour tinted a little way
 * towards a palette channel — so the gradient follows whatever theme it is
 * dropped into instead of carrying a palette of its own, and stays legible in
 * light and dark alike.
 */

/** The preset used when nothing is asked for: the background is on by default. */
export const DEFAULT_GRADIENT: Exclude<AnimatedStackGradient, 'none'> = 'subtle';

/** Milliseconds for one full loop. Slow enough that the motion reads as ambient. */
export const DEFAULT_GRADIENT_DURATION = 8000;

/**
 * The gradient is painted at twice the element's size so there is somewhere for
 * it to travel: only the offset moves, never the element or its children.
 */
export const GRADIENT_BACKGROUND_SIZE = '200% 200%';

/**
 * The loop, as `background-position` keyframes. The last frame **is** the first
 * frame, so a cycle ends on exactly the pixels it started from and the loop
 * boundary is invisible; easing the sweep at every keyframe means the turn is
 * free of any jump in speed either.
 */
export const GRADIENT_KEYFRAMES: string[] = ['0% 50%', '100% 50%', '0% 50%'];

/** Palette channels a preset can tint the surface towards. */
type GradientChannel = 'primary' | 'secondary' | 'info' | 'success' | 'warning';

interface GradientStop {
  channel: GradientChannel;
  /** How far the surface is tinted towards the channel, `0`–`1`. */
  weight: number;
}

interface GradientPreset {
  /** Direction of the sweep, in degrees. */
  angle: number;
  stops: GradientStop[];
}

/**
 * Tint weights stay low on purpose. A stop is the theme's own surface colour
 * nudged towards a channel, never the channel itself, which is what keeps
 * `text.primary` above WCAG AA on every frame of the loop — asserted for both
 * default themes in `AnimatedStack.gradient.test.ts`.
 */
const GRADIENT_PRESETS: Record<Exclude<AnimatedStackGradient, 'none'>, GradientPreset> = {
  subtle: {
    angle: 120,
    stops: [
      { channel: 'primary', weight: 0.06 },
      { channel: 'secondary', weight: 0.04 },
      { channel: 'primary', weight: 0.09 },
    ],
  },
  aurora: {
    angle: 120,
    stops: [
      { channel: 'info', weight: 0.16 },
      { channel: 'secondary', weight: 0.14 },
      { channel: 'success', weight: 0.12 },
    ],
  },
  dusk: {
    angle: 120,
    stops: [
      { channel: 'secondary', weight: 0.16 },
      { channel: 'primary', weight: 0.14 },
      { channel: 'warning', weight: 0.1 },
    ],
  },
};

/** Channel values as plain `0`–`255` RGB, whatever notation the theme uses. */
function toRgbValues(color: string): [number, number, number] {
  const decomposed = decomposeColor(color);
  const { values } = decomposed.type.startsWith('hsl')
    ? decomposeColor(hslToRgb(color))
    : decomposed;
  return [values[0], values[1], values[2]];
}

/**
 * Mix `overlay` into `base` by `weight`, returning an **opaque** colour.
 *
 * Opaque rather than a translucent overlay: the stack then paints its own
 * surface instead of letting whatever sits behind it bleed through, so the
 * contrast a child gets is the contrast this module can guarantee.
 */
export function tintColor(base: string, overlay: string, weight: number): string {
  const from = toRgbValues(base);
  const to = toRgbValues(overlay);
  const mix = (index: 0 | 1 | 2) => Math.round(from[index] * (1 - weight) + to[index] * weight);
  return recomposeColor({ type: 'rgb', values: [mix(0), mix(1), mix(2)] });
}

/**
 * The opaque colours the gradient runs through, in order — the lightest and the
 * darkest frame of the loop are both in here, which is what a contrast check
 * needs. Empty for `'none'`.
 */
export function gradientStopColors(theme: Theme, gradient: AnimatedStackGradient): string[] {
  if (gradient === 'none') return [];
  const surface = theme.palette.background.paper;
  return presetFor(gradient).stops.map((stop) =>
    tintColor(surface, theme.palette[stop.channel].main, stop.weight),
  );
}

/** The style properties the background needs, minus the position the loop animates. */
export interface GradientBackgroundStyle {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  backgroundRepeat: string;
}

/**
 * The static half of the gradient, ready for `sx`. `undefined` for `'none'`, so
 * opting out leaves the stack without a background of its own.
 *
 * `backgroundColor` sits under the image as the opaque base: it is the same
 * surface colour the stops are built from, so a browser that drops the gradient
 * falls back to a plain surface rather than to transparent.
 */
export function gradientBackgroundStyle(
  theme: Theme,
  gradient: AnimatedStackGradient,
): GradientBackgroundStyle | undefined {
  if (gradient === 'none') return undefined;
  const stops = gradientStopColors(theme, gradient);
  return {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: `linear-gradient(${presetFor(gradient).angle}deg, ${stops.join(', ')})`,
    backgroundSize: GRADIENT_BACKGROUND_SIZE,
    backgroundRepeat: 'no-repeat',
  };
}

/** Falls back to the default preset, so an unknown name from JS still renders. */
function presetFor(gradient: Exclude<AnimatedStackGradient, 'none'>): GradientPreset {
  return GRADIENT_PRESETS[gradient] ?? GRADIENT_PRESETS[DEFAULT_GRADIENT];
}

/**
 * Transition for the looping sweep: one cycle out and back per `durationMs`,
 * repeating forever. Eased rather than linear, so the turn at each end of the
 * sweep has no visible kick.
 */
export function buildGradientTransition(durationMs: number): MotionTransitionConfig {
  return {
    duration: durationMs / 1000,
    ease: DEFAULT_EASING,
    repeat: Infinity,
    repeatType: 'loop',
  };
}
