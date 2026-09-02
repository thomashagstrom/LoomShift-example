import type { MenuProps } from '@mui/material/Menu';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in enter/exit animations. `animationVariant` is fully optional on
 * {@link AnimatedMenu} and defaults to `'grow'`, matching MUI's own default
 * `Grow` transition for `Menu`.
 */
export type AnimatedMenuVariant = 'fade' | 'grow' | 'slide-down' | 'slide-up';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedMenuEasing = MotionEasing;

export interface AnimatedMenuProps extends Omit<MenuProps, 'TransitionComponent'> {
  /**
   * Enter/exit animation preset. Defaults to `'grow'`.
   *
   * Named `animationVariant` rather than the library's usual `variant`
   * because MUI's own `Menu` already has a `variant` prop (`'menu'` vs.
   * `'selectedMenu'`) — this one stays fully forwarded and untouched.
   */
  animationVariant?: AnimatedMenuVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedMenuEasing;
}
