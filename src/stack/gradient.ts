import { alpha } from '@mui/material/styles';
import type { CSSObject, Theme } from '@mui/material/styles';
import { DEFAULT_AMBIENT_DURATION, DEFAULT_EASING } from '../shared/animation';

/**
 * The default surface of {@link AnimatedStack}: a slow gradient pan, built from
 * the theme palette so it needs no configuration and no colour of its own.
 *
 * Only `background-position` moves, and it moves through Framer Motion like
 * every other animation in the library — the gradient itself is a static
 * `linear-gradient` that the pan slides across.
 */

/**
 * Opacity of each palette tint painted over the surface colour.
 *
 * Low on purpose: the gradient has to read as an ambient tint *of* the surface,
 * not as a colour in its own right. That is what keeps every text style the
 * theme pairs with `background.paper` above the WCAG AA ratio at every frame of
 * the loop — asserted for both default themes in `gradient.test.ts`.
 */
export const GRADIENT_TINT_OPACITY = 0.08;

/** A shallow diagonal, so the pan travels the long edge of a panel. */
const GRADIENT_ANGLE = '120deg';

/** Fewest colours a `gradientColors` override needs for the sweep to have two ends. */
const MIN_GRADIENT_COLORS = 2;

/**
 * How far the gradient is scaled past the element. The pan moves the visible
 * window across that overflow, so the sweep never runs out of gradient.
 */
const GRADIENT_SIZE = '200% 200%';

/**
 * The pan, as `background-position` keyframes.
 *
 * The last frame is the first one again, so the loop closes on itself: the
 * gradient is back where it started when the repeat comes round, and the eased
 * turn brings it to a stop at both ends. There is no seam to see, because there
 * is no distance to jump.
 */
export const GRADIENT_KEYFRAMES = ['0% 50%', '100% 50%', '0% 50%'];

/** Where the sweep rests when there is no motion. */
export const GRADIENT_REST = GRADIENT_KEYFRAMES[0];

/**
 * Timing of one full there-and-back sweep, repeating for as long as the stack
 * is mounted. Applied to `background-position` alone, so the enter animation
 * keeps its own (much shorter) `duration` and `easing`.
 */
export const GRADIENT_TRANSITION = {
  duration: DEFAULT_AMBIENT_DURATION / 1000,
  ease: DEFAULT_EASING,
  repeat: Infinity,
};

/**
 * Tint one override colour the way the default palette stops are tinted.
 * `alpha` throws on a string it cannot parse as a colour, which is exactly the
 * signal an invalid override needs to give — caught by {@link buildGradientStops}
 * and treated the same as a missing one.
 */
function tryTint(color: string): string | null {
  try {
    return alpha(color, GRADIENT_TINT_OPACITY);
  } catch {
    return null;
  }
}

/**
 * The gradient's colour stops, tinted from the theme palette by default.
 *
 * `colors` lets a caller override which colours get tinted — brand colours
 * instead of the theme's `primary`/`secondary` — but only once there are enough
 * of them to sweep between and every one of them parses as a colour. Anything
 * short of that (too few colours, an unparsable one) falls back to the theme
 * pair rather than rendering a broken background.
 *
 * First and last stop are always the same tint, which is what lets the sweep
 * run both ways without either end looking like a different surface.
 */
export function buildGradientStops(theme: Theme, colors?: string[]): string[] {
  if (colors && colors.length >= MIN_GRADIENT_COLORS) {
    const tinted = colors.map(tryTint);
    if (tinted.every((stop): stop is string => stop !== null)) {
      return [...tinted, tinted[0]];
    }
  }

  const { primary, secondary } = theme.palette;
  return [primary.main, secondary.main, primary.main].map((color) =>
    alpha(color, GRADIENT_TINT_OPACITY),
  );
}

/** Overrides {@link buildGradientSx} accepts in place of the theme default. */
export interface GradientOverrides {
  /** Brand colours to tint instead of the theme's `primary`/`secondary` (2+ needed). */
  colors?: string[];
  /** Angle or direction to sweep along, in `linear-gradient` syntax (e.g. `'45deg'`). */
  angle?: string;
}

/**
 * The static half of the surface: the gradient, its scale, and the position the
 * pan starts from. Only the position is ever animated.
 *
 * The tints are painted over an opaque `background.paper` rather than straight
 * onto whatever is behind the stack, so what the children sit on is known —
 * paper plus 8% of a palette colour — and its contrast can be reasoned about.
 */
export function buildGradientSx(theme: Theme, overrides?: GradientOverrides): CSSObject {
  return {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: `linear-gradient(${overrides?.angle ?? GRADIENT_ANGLE}, ${buildGradientStops(theme, overrides?.colors).join(', ')})`,
    backgroundSize: GRADIENT_SIZE,
    backgroundPosition: GRADIENT_REST,
  };
}

/**
 * Timing of one full there-and-back sweep, honouring a caller's override.
 *
 * Kept separate from the static {@link GRADIENT_TRANSITION} rather than folding
 * the override into it, so a component with no override still gets the same
 * object identity Framer Motion has always seen.
 */
export function buildGradientTransition(durationMs?: number): typeof GRADIENT_TRANSITION {
  if (durationMs === undefined) {
    return GRADIENT_TRANSITION;
  }
  return { ...GRADIENT_TRANSITION, duration: durationMs / 1000 };
}
