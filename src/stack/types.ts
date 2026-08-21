import type { StackProps } from '@mui/material/Stack';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter animations, played once as the stack mounts. `variant` is fully
 * optional on {@link AnimatedStack} and defaults to `'fade'` — the preset that
 * moves nothing, so wrapping an existing layout never shifts it.
 */
export type AnimatedStackVariant = 'fade' | 'grow' | 'slide-up' | 'slide-down';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedStackEasing = MotionEasing;

/**
 * Built-in animated gradient backgrounds, painted on the stack itself and
 * derived from the theme's own palette. `gradient` is fully optional on
 * {@link AnimatedStack} and defaults to `'subtle'`, so a panel is polished with
 * no configuration at all; `'none'` opts out and leaves the stack with no
 * background of its own.
 */
export type AnimatedStackGradient = 'none' | 'subtle' | 'aurora' | 'dusk';

/**
 * Every MUI `Stack` prop plus the shared animation trio. Extending `StackProps`
 * rather than re-declaring the layout props is what makes an unknown prop a
 * TypeScript error: the surface is exactly `Stack`'s, no wider.
 */
export interface AnimatedStackProps extends StackProps {
  /** Enter animation preset. Defaults to `'fade'`. */
  variant?: AnimatedStackVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedStackEasing;
  /** Animated gradient background preset. Defaults to `'subtle'`. */
  gradient?: AnimatedStackGradient;
  /** Milliseconds for one full gradient loop. Defaults to `8000`. */
  gradientDuration?: number;
}
