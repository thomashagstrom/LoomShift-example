import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';
import type { TransitionProps } from '@mui/material/transitions';
import { motion, useReducedMotion } from 'framer-motion';
import type {
  AnimationDefinition,
  Transition as MotionTransitionConfig,
  Tween,
  Variants,
} from 'framer-motion';

/**
 * Built-in enter/exit animations. `variant` is fully optional on
 * {@link AnimatedDialog} and defaults to `'zoom'`.
 */
export type AnimatedDialogVariant = 'fade' | 'zoom' | 'slide-up' | 'slide-down';

/**
 * Easing accepted by Framer Motion (named curve, cubic-bezier array, …).
 *
 * Derived from `Tween` because Framer Motion's `Transition` is a union in which
 * `ease` only exists on some branches, so it cannot be indexed directly.
 */
export type AnimatedDialogEasing = NonNullable<Tween['ease']>;

/**
 * Enter (`open`) and exit (`closed`) targets per variant. Framer Motion
 * interpolates between them; reduced motion collapses the duration to `0`.
 */
const VARIANTS: Record<AnimatedDialogVariant, Variants> = {
  fade: {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  },
  zoom: {
    closed: { opacity: 0, scale: 0.92 },
    open: { opacity: 1, scale: 1 },
  },
  'slide-up': {
    closed: { opacity: 0, y: 32 },
    open: { opacity: 1, y: 0 },
  },
  'slide-down': {
    closed: { opacity: 0, y: -32 },
    open: { opacity: 1, y: 0 },
  },
};

const DEFAULT_VARIANT: AnimatedDialogVariant = 'zoom';
/** Milliseconds — mirrors MUI's convention of expressing durations in ms. */
const DEFAULT_DURATION = 250;
const DEFAULT_EASING: AnimatedDialogEasing = 'easeInOut';

/**
 * Props passed to the internal Framer Motion transition by {@link AnimatedDialog}.
 *
 * MUI's `TransitionProps` declares its own (incompatible) `easing`, so it is
 * omitted here and replaced with the Framer Motion easing type.
 */
interface MotionTransitionProps extends Omit<TransitionProps, 'easing'> {
  children: React.ReactElement;
  variant?: AnimatedDialogVariant;
  duration?: number;
  easing?: AnimatedDialogEasing;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/**
 * Drop-in `TransitionComponent` for MUI's `Dialog`/`Modal`.
 *
 * MUI keeps the dialog mounted while `in` is `false` and only unmounts once the
 * transition reports `onExited`, so this component drives that lifecycle from
 * Framer Motion's animation callbacks. The wrapping `motion.div` fills the modal
 * root (`height: 100%`) so the inner `MuiDialog-container` keeps centering the
 * dialog exactly as it does with MUI's built-in transitions.
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
      // `TransitionActions.exit` is a `boolean`, which collides with Framer Motion's
      // `exit` variant prop on `motion.div`; drop it so the spread stays type-safe.
      exit: _exit,
      timeout: _timeout,
      addEndListener: _addEndListener,
      mountOnEnter: _mountOnEnter,
      unmountOnExit: _unmountOnExit,
      // MUI's `TransitionProps` extends `React.HTMLAttributes`, so it carries DOM
      // handlers whose Framer Motion namesakes on `motion.div` have incompatible
      // signatures (`onAnimationStart` and the drag handlers, which Framer repurposes
      // for pan gestures). Drop them here so the spread below stays type-safe; MUI
      // never supplies them to a transition component at runtime.
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

    const transition: MotionTransitionConfig = {
      duration: (prefersReducedMotion ? 0 : duration) / 1000,
      ease: easing,
    };

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
        style={{ height: '100%', outline: 'none', ...style }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

export interface AnimatedDialogProps extends Omit<DialogProps, 'TransitionComponent'> {
  /** Enter/exit animation preset. Defaults to `'zoom'`. */
  variant?: AnimatedDialogVariant;
  /** Animation duration in milliseconds. Defaults to `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to `'easeInOut'`. */
  easing?: AnimatedDialogEasing;
}

/**
 * A MUI `Dialog` that animates its enter/exit with Framer Motion out of the box.
 *
 * All MUI `Dialog` props are supported and forwarded, so accessibility roles
 * (`role="dialog"`, `aria-modal`, labelling) and focus trapping are preserved.
 * Users who set `prefers-reduced-motion` get an instant, motion-free transition.
 */
export const AnimatedDialog = React.forwardRef<HTMLDivElement, AnimatedDialogProps>(
  function AnimatedDialog(
    {
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      TransitionProps: transitionProps,
      ...dialogProps
    },
    ref,
  ) {
    return (
      <Dialog
        ref={ref}
        TransitionComponent={
          MotionTransition as unknown as NonNullable<DialogProps['TransitionComponent']>
        }
        TransitionProps={
          {
            ...transitionProps,
            variant,
            duration,
            easing,
          } as unknown as TransitionProps
        }
        {...dialogProps}
      />
    );
  },
);

export default AnimatedDialog;
