import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DURATION,
  DEFAULT_EASING,
  buildMotionTransition,
} from './animation';

describe('buildMotionTransition', () => {
  it('converts the millisecond duration to seconds for Framer Motion', () => {
    const transition = buildMotionTransition(250, 'easeInOut', false);
    expect(transition.duration).toBe(0.25);
    expect(transition.ease).toBe('easeInOut');
  });

  it('collapses the duration to zero when reduced motion is preferred', () => {
    const transition = buildMotionTransition(DEFAULT_DURATION, DEFAULT_EASING, true);
    expect(transition.duration).toBe(0);
  });

  it('treats a null reduced-motion preference as motion allowed', () => {
    const transition = buildMotionTransition(400, 'linear', null);
    expect(transition.duration).toBe(0.4);
  });
});
