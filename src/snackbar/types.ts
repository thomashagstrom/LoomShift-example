import type { SnackbarProps } from '@mui/material/Snackbar';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter/exit animations. `variant` is fully optional on
 * {@link AnimatedSnackbar} and defaults to `'slide-up'`.
 */
export type AnimatedSnackbarVariant = 'fade' | 'grow' | 'slide-up' | 'slide-down';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedSnackbarEasing = MotionEasing;

export interface AnimatedSnackbarProps extends Omit<SnackbarProps, 'TransitionComponent'> {
  /** Enter/exit animation preset. Defaults to `'slide-up'`. */
  variant?: AnimatedSnackbarVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedSnackbarEasing;
}
