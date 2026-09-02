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
 *
 * `grow` copies MUI's own default `Grow` transition (fade plus a scale up from
 * `0.75`), which is why it is the default here too: swapping in Framer Motion
 * changes nothing about how the menu looks or where it grows from.
 */
const VARIANTS: Record<AnimatedMenuVariant, Variants> = {
  fade: {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  },
  grow: {
    closed: { opacity: 0, scale: 0.75 },
    open: { opacity: 1, scale: 1 },
  },
  'slide-up': {
    closed: { opacity: 0, y: 8 },
    open: { opacity: 1, y: 0 },
  },
  'slide-down': {
    closed: { opacity: 0, y: -8 },
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
 * A cloned element's own `ref`, across React versions: React 19 moved `ref`
 * onto `props`, while older React (still supported via this package's peer
 * range) keeps it as the element's own field.
 */
function getElementRef<T>(element: React.ReactElement): React.Ref<T> | null {
  const props = element.props as { ref?: React.Ref<T> };
  return props.ref ?? (element as unknown as { ref?: React.Ref<T> }).ref ?? null;
}

/**
 * Drop-in `TransitionComponent` for MUI's `Menu` (and the `Popover` it wraps
 * internally).
 *
 * Unlike {@link AnimatedDialog} and `AnimatedSnackbar`, this transition does
 * **not** wrap its child in a `motion.div`. Popover positions the menu by
 * measuring the anchor and writing `top`/`left`/`transformOrigin` in pixels
 * directly onto the Paper element; a wrapping element sized to the viewport
 * would make Framer Motion's `scale` grow from the *viewport's* centre instead
 * of the anchor's corner. Cloning the animation straight onto the Paper —
 * swapping its root element to `motion.div` via MUI's `component` prop, the
 * same slot MUI's own `Grow` clones into — keeps growth anchored exactly where
 * Popover already computed it to be, and leaves that positioning math
 * untouched.
 */
const MotionTransition = React.forwardRef<HTMLElement, MotionTransitionProps>(
  function MotionTransition(props, ref) {
    const {
      in: inProp,
      children,
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      style,
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
      // remaining passthrough props forward cleanly onto the motion element.
      enter: _enter,
      exit: _exit,
      onAnimationStart: _onAnimationStart,
      onDrag: _onDrag,
      onDragStart: _onDragStart,
      onDragEnd: _onDragEnd,
      ...rest
    } = props;

    const prefersReducedMotion = useReducedMotion();
    const nodeRef = React.useRef<HTMLElement | null>(null);
    const isAppearing = React.useRef(true);

    // The Paper element MUI hands us already carries its own `ref` (Popover's
    // positioning depends on it), so this one is merged in rather than
    // replacing it.
    const handleRef = React.useCallback(
      (node: HTMLElement | null) => {
        nodeRef.current = node;
        setRef(ref, node);
        setRef(getElementRef<HTMLElement>(children), node);
      },
      [ref, children],
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

    return React.cloneElement(children, {
      ...rest,
      ref: handleRef,
      // Swaps the Paper's root element for `motion.div` (MUI's `Paper`
      // forwards unknown props, `component` included, all the way to its
      // root), which is what turns `animate`/`variants` below into a real
      // animation instead of inert DOM attributes.
      component: motion.div,
      initial: 'closed',
      animate: inProp ? 'open' : 'closed',
      variants: VARIANTS[variant] ?? VARIANTS[DEFAULT_VARIANT],
      transition,
      onAnimationStart: handleStart,
      onAnimationComplete: handleComplete,
      style: { outline: 'none', ...children.props.style, ...style },
    });
  },
);

/**
 * A MUI `Menu` that animates its enter/exit with Framer Motion out of the box.
 *
 * All MUI `Menu` (and the `Popover` it wraps) props are supported and
 * forwarded, so `anchorEl`, `anchorOrigin`/`transformOrigin` and every
 * accessibility behaviour — `role="menu"`, roving focus, Esc/backdrop dismissal
 * — are preserved exactly as MUI implements them; this component only swaps
 * the transition. Users who set `prefers-reduced-motion` get an instant,
 * motion-free transition. Animation defaults are shared with the rest of the
 * library (see `../shared/animation`).
 *
 * The default `'grow'` variant matches MUI's own default `Grow` transition —
 * a fade plus a scale up from the anchor's corner — so adopting this component
 * changes nothing about how the menu looks by default, only how the animation
 * is produced. `'fade'` and the `'slide-up'`/`'slide-down'` presets are opt-in
 * alternatives; theme colours, spacing and typography come from the `MenuItem`s
 * (or other content) passed as `children`, exactly as with a plain MUI `Menu`.
 */
export const AnimatedMenu = React.forwardRef<HTMLDivElement, AnimatedMenuProps>(
  function AnimatedMenu(
    {
      variant = DEFAULT_VARIANT,
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
            variant,
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
