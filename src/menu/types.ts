import type { MenuProps } from '@mui/material/Menu';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter/exit animations. `transitionVariant` is fully optional on
 * {@link AnimatedMenu} and defaults to `'grow'` — MUI's own `Menu` grows out of
 * its anchor by default, so this keeps the familiar feel while swapping the
 * implementation for Framer Motion.
 *
 * Named `transitionVariant` rather than `variant`, unlike the rest of the
 * library, because MUI's `Menu` already has a `variant` prop of its own
 * (`'menu' | 'selectedMenu'`, controlling initial focus) that `AnimatedMenu`
 * still forwards untouched.
 */
export type AnimatedMenuVariant = 'fade' | 'grow' | 'slide-down' | 'slide-up';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedMenuEasing = MotionEasing;

export interface AnimatedMenuProps extends Omit<MenuProps, 'TransitionComponent'> {
  /** Enter/exit animation preset. Defaults to `'grow'`. */
  transitionVariant?: AnimatedMenuVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedMenuEasing;
}
