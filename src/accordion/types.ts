import type { AccordionProps } from '@mui/material/Accordion';
import type { MotionEasing } from '../shared/animation';

/**
 * Built-in expand/collapse animations. `animationVariant` is fully optional on
 * {@link AnimatedAccordion} and defaults to `'collapse'`.
 *
 * `'collapse'` animates height only, matching MUI's own `Collapse` transition.
 * `'fade'` layers an opacity fade on top of the same height animation.
 *
 * Named `animationVariant` rather than the library's usual `variant`: MUI's
 * `Accordion` extends `Paper`, which already has its own `variant`
 * (`'elevation' | 'outlined'`) — reusing the name would either collide with
 * it or narrow what a host can pass for MUI's `variant`.
 */
export type AnimatedAccordionVariant = 'collapse' | 'fade';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedAccordionEasing = MotionEasing;

export interface AnimatedAccordionProps extends Omit<AccordionProps, 'TransitionComponent'> {
  /** Enter/exit animation preset. Defaults to `'collapse'`. */
  animationVariant?: AnimatedAccordionVariant;
  /** Animation duration in milliseconds. Defaults to the shared `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to the shared `'easeInOut'`. */
  easing?: AnimatedAccordionEasing;
}
