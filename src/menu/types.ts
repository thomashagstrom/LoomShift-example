import type { MenuProps } from '@mui/material/Menu';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter/exit animations. `variant` is fully optional on
 * {@link AnimatedMenu} and defaults to `'fade'`.
 */
export type AnimatedMenuVariant = 'fade' | 'grow';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedMenuEasing = MotionEasing;

export interface AnimatedMenuProps extends Omit<MenuProps, 'TransitionComponent'> {
  /**
   * Enter/exit animation preset. Defaults to `'fade'`.
   *
   * Named `animationVariant` rather than `variant` because MUI's own `Menu`
   * already uses `variant` for `'menu' | 'selectedMenu'` — that prop is still
   * forwarded untouched.
   */
  animationVariant?: AnimatedMenuVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedMenuEasing;
}
