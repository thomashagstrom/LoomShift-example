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
import { DEFAULT_DURATION, DEFAULT_EASING, buildMotionTransition } from '../shared/animation';
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
    closed: { opacity: 0, scale: 0.9 },
    open: { opacity: 1, scale: 1 },
  },
};

const DEFAULT_VARIANT: AnimatedMenuVariant = 'fade';

/**
 * Props passed to the internal Framer Motion transition by {@link AnimatedMenu}.
 *
 * MUI's `TransitionProps` declares its own (incompatible) `easing`, so it is
 * omitted here and replaced with the Framer Motion easing type.
 */
interface MotionTransitionProps extends Omit<TransitionProps, 'easing'> {
  children: React.ReactElement;
  animationVariant?: AnimatedMenuVariant;
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
 * Drop-in `TransitionComponent` for MUI's `Menu` (and the `Popover` it is
 * built on).
 *
 * Popover positions its `Paper` imperatively — via a ref forwarded straight
 * onto that element — once it enters, so wrapping it in a `motion.div` here
 * does not disturb that positioning; the ref stays attached to the `Paper`
 * regardless of what wraps it. MUI keeps the menu mounted while `in` is
 * `false` and only unmounts once the transition reports `onExited`, so this
 * component drives that lifecycle from Framer Motion's animation callbacks.
 */
const MotionTransition = React.forwardRef<HTMLDivElement, MotionTransitionProps>(
  function MotionTransition(props, ref) {
    const {
      in: inProp,
      children,
      style,
      animationVariant = DEFAULT_VARIANT,
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
        variants={VARIANTS[animationVariant] ?? VARIANTS[DEFAULT_VARIANT]}
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
 * All MUI `Menu` props are supported and forwarded — `anchorEl`, `anchorOrigin`,
 * `MenuListProps` and the rest — so the menu can be triggered from any element:
 * pass a ref or an event's `currentTarget` as `anchorEl` and toggle `open` from
 * a click handler, the same way MUI's own `Menu` is used. Every visual detail —
 * `Paper` background, elevation, spacing and typography of `MenuItem`s — keeps
 * coming from the surrounding theme, since this component only swaps the
 * transition and forwards everything else untouched. Users who set
 * `prefers-reduced-motion` get an instant, motion-free transition. Animation
 * defaults are shared with the rest of the library (see `../shared/animation`).
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
            animationVariant,
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
