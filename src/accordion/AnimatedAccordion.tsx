import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import type { AccordionProps } from '@mui/material/Accordion';
import type { TransitionProps } from '@mui/material/transitions';
import { motion, useReducedMotion } from 'framer-motion';
import type { AnimationDefinition, Variants } from 'framer-motion';
import { DEFAULT_DURATION, DEFAULT_EASING, buildMotionTransition } from '../shared/animation';
import type {
  AnimatedAccordionEasing,
  AnimatedAccordionProps,
  AnimatedAccordionVariant,
} from './types';

const DEFAULT_VARIANT: AnimatedAccordionVariant = 'collapse';

/**
 * Props passed to the internal Framer Motion transition by
 * {@link AnimatedAccordion}.
 *
 * MUI's `TransitionProps` declares its own (incompatible) `easing`, so it is
 * omitted here and replaced with the Framer Motion easing type.
 */
interface MotionCollapseProps extends Omit<TransitionProps, 'easing'> {
  children: React.ReactElement;
  variant?: AnimatedAccordionVariant;
  duration?: number;
  easing?: AnimatedAccordionEasing;
  /**
   * Injected by MUI's `useSlot` (the mechanism behind `Accordion`'s
   * `TransitionComponent`/`slots.transition`) for styled-component slots.
   * Not part of the public `TransitionProps` contract, and not a valid DOM
   * attribute, so it is destructured out below rather than forwarded.
   */
  ownerState?: unknown;
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

/**
 * Drop-in replacement for MUI Accordion's `TransitionComponent` — by default
 * `Collapse` itself, not the lower-level `Transition` the other slices
 * replace, so this component owns the whole height animation rather than
 * plugging into an existing one.
 *
 * Framer Motion cannot tween the literal string `'auto'` — animating a
 * `height` from or to it just snaps instead of interpolating — so the target
 * is a measured pixel value instead: `contentRef`'s `scrollHeight`, kept
 * current by a `ResizeObserver` so content that resizes while expanded (an
 * image loading in, a validation message appearing) re-measures instead of
 * clipping or leaving a gap.
 *
 * The collapsed panel stays mounted (arbitrary children keep their state
 * across toggles, matching MUI's own `Accordion`), but is hidden with
 * `visibility: hidden` once fully collapsed and at rest — the same technique
 * MUI's `Collapse` uses to keep closed content out of the tab order and off a
 * screen reader's radar, satisfying the WAI-ARIA Accordion Pattern's
 * expectation that a collapsed panel is not reachable.
 */
const MotionCollapse = React.forwardRef<HTMLDivElement, MotionCollapseProps>(
  function MotionCollapse(props, ref) {
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
      ownerState: _ownerState,
      ...rest
    } = props;

    const prefersReducedMotion = useReducedMotion();
    const nodeRef = React.useRef<HTMLDivElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const isAppearing = React.useRef(true);

    const handleRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        nodeRef.current = node;
        setRef(ref, node);
      },
      [ref],
    );

    // The pixel height Framer Motion animates towards/from. Re-measured on
    // every render (cheap: a single `scrollHeight` read) and whenever the
    // content itself resizes, so the target always matches what is actually
    // mounted rather than a stale snapshot from the last expand.
    const [contentHeight, setContentHeight] = React.useState(0);

    React.useLayoutEffect(() => {
      const node = contentRef.current;
      if (!node) {
        return;
      }

      setContentHeight(node.scrollHeight);

      // jsdom (unit tests) does not implement `ResizeObserver`; the initial
      // measurement above still runs, only the "keep watching" part is
      // unavailable there.
      if (typeof ResizeObserver === 'undefined') {
        return undefined;
      }

      const observer = new ResizeObserver(() => setContentHeight(node.scrollHeight));
      observer.observe(node);
      return () => observer.disconnect();
    }, [children]);

    const transition = buildMotionTransition(duration, easing, prefersReducedMotion);

    const variants: Variants = {
      closed: variant === 'fade' ? { height: 0, opacity: 0 } : { height: 0 },
      open:
        variant === 'fade'
          ? { height: contentHeight, opacity: 1 }
          : { height: contentHeight },
    };

    // Tracks whether the panel is fully collapsed and settled, as opposed to
    // mid-animation — only the settled state is hidden, so the collapsing
    // motion itself stays visible.
    const [hiddenAtRest, setHiddenAtRest] = React.useState(!inProp);

    const handleStart = (definition: AnimationDefinition) => {
      const node = nodeRef.current as HTMLElement;
      setHiddenAtRest(false);
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
        setHiddenAtRest(true);
        onExited?.(node);
      }
    };

    return (
      <motion.div
        ref={handleRef}
        initial="closed"
        animate={inProp ? 'open' : 'closed'}
        variants={variants}
        transition={transition}
        onAnimationStart={handleStart}
        onAnimationComplete={handleComplete}
        style={{
          overflow: 'hidden',
          visibility: hiddenAtRest ? 'hidden' : 'visible',
          ...style,
        }}
        {...rest}
      >
        <div ref={contentRef}>{children}</div>
      </motion.div>
    );
  },
);

/**
 * A MUI `Accordion` that animates its expand/collapse with Framer Motion out
 * of the box.
 *
 * All MUI `Accordion` props are supported and forwarded — including its
 * "first child is the summary, the rest is the body" composition — so any
 * number of children work exactly as they do with plain MUI, and its
 * accessibility baseline (the `AccordionSummary` button's `aria-expanded`/
 * `aria-controls`, and the `role="region"` MUI puts on the body) is preserved
 * untouched. This conforms to the [WAI-ARIA Accordion
 * Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/). Users who set
 * `prefers-reduced-motion` get an instant, motion-free transition.
 *
 * `animationVariant="collapse"` (the default) animates height only, matching
 * MUI's own `Collapse`. `animationVariant="fade"` layers an opacity fade on
 * top of the same height animation, for panels whose content should not
 * visibly reflow into place. (Named `animationVariant`, not `variant` — MUI's
 * `Accordion` already has its own `variant` inherited from `Paper`.)
 */
export const AnimatedAccordion = React.forwardRef<HTMLDivElement, AnimatedAccordionProps>(
  function AnimatedAccordion(
    {
      animationVariant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      TransitionProps: transitionProps,
      ...accordionProps
    },
    ref,
  ) {
    return (
      <Accordion
        ref={ref}
        TransitionComponent={
          MotionCollapse as unknown as NonNullable<AccordionProps['TransitionComponent']>
        }
        TransitionProps={
          {
            ...transitionProps,
            variant: animationVariant,
            duration,
            easing,
          } as unknown as TransitionProps
        }
        {...accordionProps}
      />
    );
  },
);

export default AnimatedAccordion;
