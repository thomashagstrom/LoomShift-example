import * as React from 'react';
import Menu from '@mui/material/Menu';
import type { MenuProps } from '@mui/material/Menu';
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
import type { AnimatedMenuEasing, AnimatedMenuProps, AnimatedMenuVariant } from './types';

/**
 * Enter (`open`) and exit (`closed`) targets per variant. Framer Motion
 * interpolates between them; reduced motion collapses the duration to `0`.
 */
const VARIANTS: Record<AnimatedMenuVariant, Variants> = {
  fade: {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  },
  grow: {
    closed: { opacity: 0, scale: 0.85 },
    open: { opacity: 1, scale: 1 },
  },
  'slide-down': {
    closed: { opacity: 0, y: -8 },
    open: { opacity: 1, y: 0 },
  },
  'slide-up': {
    closed: { opacity: 0, y: 8 },
    open: { opacity: 1, y: 0 },
  },
};

const DEFAULT_VARIANT: AnimatedMenuVariant = 'grow';

/**
 * Props passed to the internal Framer Motion transition by {@link AnimatedMenu}.
 *
 * MUI's `TransitionProps` declares its own (incompatible) `easing`, so it is
 * omitted here and replaced with the Framer Motion easing type.
 */
interface MotionTransitionProps extends Omit<TransitionProps, 'easing'> {
  children: React.ReactElement;
  variant?: AnimatedMenuVariant;
  duration?: number;
  easing?: AnimatedMenuEasing;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/**
 * Drop-in `TransitionComponent` for MUI's `Menu`/`Popover`.
 *
 * MUI keeps the menu mounted while `in` is `false` and only unmounts once the
 * transition reports `onExited`, so this component drives that lifecycle from
 * Framer Motion's animation callbacks — the same contract {@link AnimatedDialog}
 * and `AnimatedSnackbar` bridge for their own MUI transitions. `Popover`
 * positions its `Paper` (this wrapper's `children`) itself, imperatively
 * setting `top`/`left`/`transform-origin` from the `anchorEl` once it mounts,
 * so the wrapper only needs to animate opacity/scale/position on top of that —
 * it never touches placement itself.
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
 * A MUI `Menu` that animates its enter/exit with Framer Motion out of the box.
 *
 * All MUI `Menu` props are supported and forwarded, so `anchorEl` still
 * anchors it to any element on the page, and its accessibility baseline —
 * `role="menu"`, roving focus across `MenuItem`s and dismissal on Escape or
 * an outside click — is preserved. Users who set `prefers-reduced-motion` get
 * an instant, motion-free transition. Animation defaults are shared with the
 * rest of the library (see `../shared/animation`), so a menu feels consistent
 * with every other animated component here.
 *
 * The animation preset is `animationVariant`, not the library's usual
 * `variant` — MUI's `Menu` already owns that name for `'menu'`/`'selectedMenu'`,
 * which stays fully forwarded and untouched.
 */
export const AnimatedMenu = React.forwardRef<HTMLDivElement, AnimatedMenuProps>(
  function AnimatedMenu(
    {
      animationVariant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      TransitionProps: transitionProps,
      ...menuProps
    },
    ref,
  ) {
    return (
      <Menu
        ref={ref}
        TransitionComponent={
          MotionTransition as unknown as NonNullable<MenuProps['TransitionComponent']>
        }
        TransitionProps={
          {
            ...transitionProps,
            variant: animationVariant,
            duration,
            easing,
          } as unknown as TransitionProps
        }
        {...menuProps}
      />
    );
  },
);

export default AnimatedMenu;
