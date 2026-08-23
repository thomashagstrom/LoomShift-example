import * as React from 'react';
import Stack from '@mui/material/Stack';
import type { StackProps } from '@mui/material/Stack';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps, TargetAndTransition } from 'framer-motion';
import { DEFAULT_DURATION, DEFAULT_EASING, buildMotionTransition } from '../shared/animation';
import type { Theme } from '@mui/material/styles';
import { GRADIENT_KEYFRAMES, buildGradientSx, buildGradientTransition } from './gradient';
import type { AnimatedStackBackground, AnimatedStackProps, AnimatedStackVariant } from './types';

/** The two targets one enter preset animates between. */
type EnterTargets = { hidden: TargetAndTransition; visible: TargetAndTransition };

/**
 * Hidden (pre-mount) and visible (settled) targets per variant, in the same
 * shape as the other slices so the presets read alike. Only `opacity`, `scale`
 * and `y` are touched — never a layout property — so the animation cannot
 * disturb the flex arrangement the stack is there to provide.
 */
const ENTER_VARIANTS: Record<AnimatedStackVariant, EnterTargets> = {
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

const DEFAULT_BACKGROUND: AnimatedStackBackground = 'gradient';

/** The stack props plus only the Framer Motion props the animations need. */
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
 *
 * It also paints its own surface by default: a gradient tinted from the theme
 * palette, panned slowly and continuously, so a panel looks finished with no
 * props at all. The tints are faint enough that every text style the theme
 * pairs with `background.paper` stays above the WCAG AA ratio at every frame.
 * `background="none"` is the full opt-out, and a motion-free stack keeps the
 * gradient but rests it on one frame rather than dropping the surface.
 */
export const AnimatedStack = React.forwardRef<HTMLDivElement, AnimatedStackProps>(
  function AnimatedStack(
    {
      variant = DEFAULT_VARIANT,
      background = DEFAULT_BACKGROUND,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      gradientColors,
      gradientAngle,
      gradientDuration,
      ...stackProps
    },
    ref,
  ) {
    const prefersReducedMotion = useReducedMotion();

    // The same rule the `ConfirmActions` press follows: a reduced-motion
    // preference and an explicit `duration={0}` both mean "no motion". The
    // surface stays — it is colour, not movement — it simply stops panning.
    const motionFree = Boolean(prefersReducedMotion) || duration <= 0;
    const panGradient = background === 'gradient' && !motionFree;

    const enter = ENTER_VARIANTS[variant] ?? ENTER_VARIANTS[DEFAULT_VARIANT];
    const enterTransition = buildMotionTransition(duration, easing, prefersReducedMotion);

    return (
      <MotionStack
        ref={ref}
        initial="hidden"
        animate="visible"
        // The pan rides along in the settled target with a transition of its
        // own, so one Framer Motion animation enters the stack and another
        // keeps looping afterwards, each on its own timing.
        variants={
          panGradient
            ? {
                ...enter,
                visible: { ...enter.visible, backgroundPosition: [...GRADIENT_KEYFRAMES] },
              }
            : enter
        }
        transition={
          panGradient
            ? {
                ...enterTransition,
                backgroundPosition: buildGradientTransition(gradientDuration),
              }
            : enterTransition
        }
        {...stackProps}
        // Array form so a caller's own `sx` composes with the surface — and
        // wins over it — instead of replacing it.
        sx={[
          background === 'gradient'
            ? (theme: Theme) =>
                buildGradientSx(theme, { colors: gradientColors, angle: gradientAngle })
            : false,
          ...(Array.isArray(stackProps.sx) ? stackProps.sx : [stackProps.sx]),
        ]}
      />
    );
  },
);

export default AnimatedStack;
