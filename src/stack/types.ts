import type { StackProps } from '@mui/material/Stack';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter animations, played once as the stack mounts. `variant` is fully
 * optional on {@link AnimatedStack} and defaults to `'fade'` — the preset that
 * moves nothing, so wrapping an existing layout never shifts it.
 */
export type AnimatedStackVariant = 'fade' | 'grow' | 'slide-up' | 'slide-down';

/**
 * Surface painted behind the children. `'gradient'` is the default: a slow
 * ambient pan across a gradient tinted from the theme palette, so a panel looks
 * finished with no props at all. `'none'` is the full opt-out — the transparent
 * stack, with nothing painted behind the children.
 */
export type AnimatedStackBackground = 'gradient' | 'none';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedStackEasing = MotionEasing;

/**
 * Every MUI `Stack` prop plus the shared animation trio. Extending `StackProps`
 * rather than re-declaring the layout props is what makes an unknown prop a
 * TypeScript error: the surface is exactly `Stack`'s, no wider.
 */
export interface AnimatedStackProps extends StackProps {
  /** Enter animation preset. Defaults to `'fade'`. */
  variant?: AnimatedStackVariant;
  /** Surface painted behind the children. Defaults to `'gradient'`. */
  background?: AnimatedStackBackground;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedStackEasing;
  /**
   * Brand colours to tint the gradient with instead of the theme's
   * `primary`/`secondary`. Needs 2 or more valid CSS colours; too few, or one
   * that fails to parse, falls back to the theme pair rather than rendering a
   * broken background. Ignored when `background="none"`.
   */
  gradientColors?: string[];
  /**
   * Angle or direction the gradient sweeps along, in `linear-gradient` syntax
   * (e.g. `'45deg'`, `'to right'`). Defaults to the built-in shallow diagonal.
   */
  gradientAngle?: string;
  /**
   * How long one full ambient gradient pan takes, in milliseconds. Defaults to
   * the shared ambient duration. Distinct from `duration`, which times the
   * one-shot enter animation.
   */
  gradientDuration?: number;
}
