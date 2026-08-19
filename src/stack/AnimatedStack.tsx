import * as React from 'react';
import Stack from '@mui/material/Stack';
import type { StackProps } from '@mui/material/Stack';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps, Variants } from 'framer-motion';
import { DEFAULT_DURATION, DEFAULT_EASING, buildMotionTransition } from '../shared/animation';
import type { AnimatedStackProps, AnimatedStackVariant } from './types';

/**
 * Hidden (pre-mount) and visible (settled) targets per variant, in the same
 * shape as the other slices so the presets read alike. Only `opacity`, `scale`
 * and `y` are touched — never a layout property — so the animation cannot
 * disturb the flex arrangement the stack is there to provide.
 */
const ENTER_VARIANTS: Record<AnimatedStackVariant, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  grow: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  'slide-down': {
    hidden: { opacity: 0, y: -16 },
    visible: { opacity: 1, y: 0 },
  },
};

const DEFAULT_VARIANT: AnimatedStackVariant = 'fade';

/** The stack props plus only the Framer Motion props the enter animation needs. */
type MotionStackProps = StackProps &
  Pick<MotionProps, 'initial' | 'animate' | 'variants' | 'transition'>;

/**
 * The `Stack` itself animates rather than an extra wrapper, so its children stay
 * its direct flex items: `spacing`, `divider` and `alignItems` keep working
 * untouched, and nothing new can clip or overflow at any container width. MUI's
 * `Stack` forwards both `style` and its ref to the root `<div>`, which is all
 * Framer Motion needs.
 *
 * The cast keeps the MUI prop types: Framer Motion re-declares the DOM drag
 * handlers with its own signatures, which makes a spread `StackProps`
 * unassignable to the generated motion props.
 */
const MotionStack = motion.create(Stack) as React.ComponentType<MotionStackProps>;

/**
 * A MUI `Stack` that animates itself in as it mounts.
 *
 * It is a layout component first: every `Stack` prop (`direction`, `spacing`,
 * `alignItems`, `justifyContent`, `divider`, `sx`, …) is forwarded untouched, and
 * arbitrary children — `ConfirmActions`, cards, form rows — render as its direct
 * flex items. Wrapping an existing layout in it therefore changes when the layout
 * appears, never how it is arranged.
 *
 * The animation is a Framer Motion preset built on the shared tokens, like the
 * rest of the library: `variant` picks it, `duration` and `easing` tune it.
 * `prefers-reduced-motion` — and `duration={0}` — collapse it to an instant
 * appearance, leaving the layout and the children untouched.
 */
export const AnimatedStack = React.forwardRef<HTMLDivElement, AnimatedStackProps>(
  function AnimatedStack(
    {
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      ...stackProps
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion();

    return (
      <MotionStack
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={ENTER_VARIANTS[variant] ?? ENTER_VARIANTS[DEFAULT_VARIANT]}
        transition={buildMotionTransition(duration, easing, prefersReducedMotion)}
        {...stackProps}
      />
    );
  },
);

export default AnimatedStack;
