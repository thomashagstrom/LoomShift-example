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
 * The gradient's colour stops, tinted from the theme palette.
 *
 * First and last stop are the same tint, which is what lets the sweep run both
 * ways without either end looking like a different surface.
 */
export function buildGradientStops(theme: Theme): string[] {
  const { primary, secondary } = theme.palette;
  return [primary.main, secondary.main, primary.main].map((color) =>
    alpha(color, GRADIENT_TINT_OPACITY),
  );
}

/**
 * The static half of the surface: the gradient, its scale, and the position the
 * pan starts from. Only the position is ever animated.
 *
 * The tints are painted over an opaque `background.paper` rather than straight
 * onto whatever is behind the stack, so what the children sit on is known —
 * paper plus 8% of a palette colour — and its contrast can be reasoned about.
 */
export function buildGradientSx(theme: Theme): CSSObject {
  return {
    backgroundColor: theme.palette.background.paper,
    backgroundImage: `linear-gradient(${GRADIENT_ANGLE}, ${buildGradientStops(theme).join(', ')})`,
    backgroundSize: GRADIENT_SIZE,
    backgroundPosition: GRADIENT_REST,
  };
}
