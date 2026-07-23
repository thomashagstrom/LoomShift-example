import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import type { SnackbarProps } from '@mui/material/Snackbar';
import type { TransitionProps } from '@mui/material/transitions';
import { motion, useReducedMotion } from 'framer-motion';
import type {
  AnimationDefinition,
  Transition as MotionTransitionConfig,
  Variants,
} from 'framer-motion';
import {
  DEFAULT_DURATION,
  DEFAULT_EASING,
  buildMotionTransition,
} from '../shared/animation';
import type {
  AnimatedSnackbarEasing,
  AnimatedSnackbarProps,
  AnimatedSnackbarVariant,
} from './types';

/**
 * Enter (`open`) and exit (`closed`) targets per variant. Framer Motion
 * interpolates between them; reduced motion collapses the duration to `0`.
 */
const VARIANTS: Record<AnimatedSnackbarVariant, Variants> = {
  fade: {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  },
  grow: {
    closed: { opacity: 0, scale: 0.85 },
    open: { opacity: 1, scale: 1 },
  },
  'slide-up': {
    closed: { opacity: 0, y: 24 },
    open: { opacity: 1, y: 0 },
  },
  'slide-down': {
    closed: { opacity: 0, y: -24 },
    open: { opacity: 1, y: 0 },
  },
};

const DEFAULT_VARIANT: AnimatedSnackbarVariant = 'slide-up';

/**
 * Props passed to the internal Framer Motion transition by
 * {@link AnimatedSnackbar}.
 *
 * MUI's `TransitionProps` declares its own (incompatible) `easing`, so it is
 * omitted here and replaced with the Framer Motion easing type.
 */
interface MotionTransitionProps extends Omit<TransitionProps, 'easing'> {
  children: React.ReactElement;
  variant?: AnimatedSnackbarVariant;
  duration?: number;
  easing?: AnimatedSnackbarEasing;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/**
 * Drop-in `TransitionComponent` for MUI's `Snackbar`.
 *
 * MUI keeps the snackbar mounted while `in` is `false` and only unmounts once
 * the transition reports `onExited`, so this component drives that lifecycle
 * from Framer Motion's animation callbacks. Unlike the dialog transition, the
 * wrapper does not stretch to fill its parent so the snackbar keeps its
 * intrinsic size and anchor position.
 */
const MotionTransition = React.forwardRef<HTMLDivElement, MotionTransitionProps>(
  function MotionTransition(props, ref) {
    const {
      in: inProp,
      children,
      style,
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      onEnter,
      onEntering,
      onEntered,
      onExit,
      onExiting,
      onExited,
      // Consumed by MUI's built-in transitions; not applicable to Framer Motion.
      appear: _appear,
      timeout: _timeout,
      addEndListener: _addEndListener,
      mountOnEnter: _mountOnEnter,
      unmountOnExit: _unmountOnExit,
      // MUI's `TransitionProps` mixes in `TransitionActions` (`enter`/`exit`
      // booleans) and the DOM drag/animation handlers, all of which Framer
      // Motion redefines with incompatible signatures. Drop them so the
      // remaining passthrough props forward cleanly onto `motion.div`.
      enter: _enter,
      exit: _exit,
      onAnimationStart: _onAnimationStart,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      ...rest
    } = props;

    const prefersReducedMotion = useReducedMotion();
    const nodeRef = React.useRef<HTMLDivElement | null>(null);
    const isAppearing = React.useRef(true);

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        setRef(ref, node);
      },
      [ref],
    );

    const transition: MotionTransitionConfig = buildMotionTransition(
      duration,
      easing,
      prefersReducedMotion,
    );

    const handleStart = (definition: AnimationDefinition) => {
      const node = nodeRef.current as HTMLElement;
      if (definition === 'open') {
        onEnter?.(node, isAppearing.current);
        onEntering?.(node, isAppearing.current);
      } else if (definition === 'closed') {
        onExit?.(node);
        onExiting?.(node);
      }
    };

    const handleComplete = (definition: AnimationDefinition) => {
      const node = nodeRef.current as HTMLElement;
      if (definition === 'open') {
        onEntered?.(node, isAppearing.current);
        isAppearing.current = false;
      } else if (definition === 'closed') {
        onExited?.(node);
      }
    };

    return (
      <motion.div
        ref={handleRef}
        initial="closed"
        animate={inProp ? 'open' : 'closed'}
        variants={VARIANTS[variant] ?? VARIANTS[DEFAULT_VARIANT]}
        transition={transition}
        onAnimationStart={handleStart}
        onAnimationComplete={handleComplete}
        style={{ outline: 'none', ...style }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

/**
 * A MUI `Snackbar` that animates its enter/exit with Framer Motion out of the
 * box.
 *
 * All MUI `Snackbar` props are supported and forwarded, so `autoHideDuration`,
 * anchoring and accessibility roles are preserved. Users who set
 * `prefers-reduced-motion` get an instant, motion-free transition. Animation
 * defaults are shared with the rest of the library (see `../shared/animation`).
 */
export const AnimatedSnackbar = React.forwardRef<HTMLDivElement, AnimatedSnackbarProps>(
  function AnimatedSnackbar(
    {
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      TransitionProps: transitionProps,
      ...snackbarProps
    },
    ref,
  ) {
    return (
      <Snackbar
        ref={ref}
        TransitionComponent={
          MotionTransition as unknown as NonNullable<SnackbarProps['TransitionComponent']>
        }
        TransitionProps={
          {
            ...transitionProps,
            variant,
            duration,
            easing,
          } as unknown as TransitionProps
        }
        {...snackbarProps}
      />
    );
  },
);

export default AnimatedSnackbar;
