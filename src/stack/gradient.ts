import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { AnimatedStackBackground } from './types';

/** The presets that actually paint something — everything but `'none'`. */
export type AnimatedStackGradient = Exclude<AnimatedStackBackground, 'none'>;

/** Milliseconds for one full sweep out and back. Slow on purpose: ambient, not attention-seeking. */
export const DEFAULT_BACKGROUND_DURATION = 8000;

/**
 * How strongly each preset tints the surface, as an alpha on the palette colour.
 *
 * Both values are deliberately low. The tints are painted over an opaque
 * `background.paper`, so the surface never strays far from the one the theme
 * already guarantees its text colours against — which is what keeps
 * `text.primary` and `text.secondary` above the WCAG AA 4.5:1 ratio on every
 * stop of the gradient, in both palette modes. `gradient.contrast.test.ts` pins
 * that down rather than leaving it to the eye.
 */
export const BACKGROUND_TINTS: Record<AnimatedStackGradient, number> = {
  subtle: 0.08,
  brand: 0.18,
};

/**
 * Positions the sweep steps through, in order.
 *
 * The first and last entries are identical, so the loop ends on exactly the
 * frame it started from and repeats with nothing to see at the boundary. A
 * one-way sweep would have to snap back from `100%` to `0%`, which reads as a
 * jump however slow the animation is.
 */
export const GRADIENT_KEYFRAMES = ['0% 50%', '100% 50%', '0% 50%'];

/** The two colours the gradient sweeps between, as translucent tints. */
export function gradientTints(theme: Theme, gradient: AnimatedStackGradient): [string, string] {
  const tint = BACKGROUND_TINTS[gradient];
  return [alpha(theme.palette.primary.main, tint), alpha(theme.palette.secondary.main, tint)];
}

/**
 * The static half of the background: the surface, the gradient itself and the
 * room the sweep moves in. Everything here is paint only — no box model
 * property is touched — so turning the background on cannot shift a layout.
 */
export function gradientSx(gradient: AnimatedStackGradient) {
  return (theme: Theme) => {
    const [from, to] = gradientTints(theme, gradient);

    return {
      // Opaque, so the tints composite against a surface we know rather than
      // whatever happens to sit behind the stack. That is what makes the
      // contrast guarantee hold wherever the stack is dropped.
      backgroundColor: theme.palette.background.paper,
      // Ends on the colour it starts from, so the sweep has no seam either.
      backgroundImage: `linear-gradient(135deg, ${from}, ${to}, ${from})`,
      // Twice the box in both axes: without the overscan there is nowhere to
      // sweep to and `backgroundPosition` would have no visible effect.
      backgroundSize: '200% 200%',
      backgroundPosition: GRADIENT_KEYFRAMES[0],
    };
  };
}
