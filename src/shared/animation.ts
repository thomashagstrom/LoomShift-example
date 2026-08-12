import type { Transition as MotionTransitionConfig } from 'framer-motion';

/**
 * Shared animation tokens for LoomShift components.
 *
 * These defaults were established by the first component ({@link AnimatedDialog})
 * and are reused by every subsequent feature slice so animations feel
 * consistent across the library.
 */

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type MotionEasing = MotionTransitionConfig['ease'];

/** Milliseconds — mirrors MUI's convention of expressing durations in ms. */
export const DEFAULT_DURATION = 250;

/**
 * Default duration of a press feedback animation, in milliseconds.
 *
 * Shorter than {@link DEFAULT_DURATION}: a press animates down on pointer-down
 * and back up on release, so both halves have to fit inside the ~300ms a tap
 * still reads as instant.
 */
export const DEFAULT_PRESS_DURATION = 120;

/** Default Framer Motion easing curve. */
export const DEFAULT_EASING: MotionEasing = 'easeInOut';

/**
 * Build the Framer Motion transition config for an enter/exit animation.
 *
 * Honours `prefers-reduced-motion` by collapsing the duration to `0`, giving
 * an instant, motion-free transition. Shared so every component applies the
 * same reduced-motion behaviour.
 */
export function buildMotionTransition(
  durationMs: number,
  easing: MotionEasing,
  prefersReducedMotion: boolean | null,
): MotionTransitionConfig {
  return {
    duration: (prefersReducedMotion ? 0 : durationMs) / 1000,
    ease: easing,
  };
}
