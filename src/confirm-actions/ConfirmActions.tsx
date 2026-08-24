import * as React from 'react';
import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps, TargetAndTransition } from 'framer-motion';
import {
  DEFAULT_EASING,
  DEFAULT_PRESS_DURATION,
  buildMotionTransition,
} from '../shared/animation';
import { isPromiseLike } from '../shared/promise';
import type {
  ConfirmActionsAlign,
  ConfirmActionsPressVariant,
  ConfirmActionsProps,
} from './types';

const DEFAULT_CONFIRM_LABEL = 'Ok';
const DEFAULT_CANCEL_LABEL = 'Cancel';

/** Diameter of the pending spinner, in pixels. */
const SPINNER_SIZE = 16;

const JUSTIFY_CONTENT: Record<ConfirmActionsAlign, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/** The button props plus only the Framer Motion props the press needs. */
type MotionButtonProps = ButtonProps & Pick<MotionProps, 'animate' | 'transition'>;

/**
 * The buttons animate themselves rather than a wrapper, so `fullWidth` and the
 * `Stack` spacing keep working untouched — MUI's `Button` forwards both `style`
 * and its ref to the underlying `<button>`, which is all Framer Motion needs.
 *
 * The cast keeps the MUI prop types: Framer Motion re-declares the DOM drag
 * handlers with its own signatures, which makes a spread `ButtonProps`
 * unassignable to the generated motion props.
 */
const MotionButton = motion.create(Button) as React.ComponentType<MotionButtonProps>;

const DEFAULT_PRESS_VARIANT: ConfirmActionsPressVariant = 'scale';

/**
 * Held-down target per press variant. Framer Motion animates towards it while
 * the button is down and back to {@link PRESS_REST} on release, interpolating
 * from wherever the last press got to.
 */
const PRESS_TARGETS: Record<ConfirmActionsPressVariant, TargetAndTransition | undefined> = {
  scale: { scale: 0.96 },
  lift: { y: 2, scale: 0.99 },
  none: undefined,
};

/** Resting target, listing every property a variant touches so all of them return. */
const PRESS_REST: TargetAndTransition = { scale: 1, y: 0 };

/**
 * Motion-free stand-in for a press: an instant shade change, so holding a button
 * down is still acknowledged without anything moving. `filter` shades whatever
 * colour the button already has, which keeps it theme-agnostic and works the
 * same on the contained confirm and the text cancel.
 */
const PRESS_SHADE: TargetAndTransition = { filter: 'brightness(0.9)' };

/** Resting shade, so a release puts the button back to its own colour. */
const PRESS_SHADE_REST: TargetAndTransition = { filter: 'brightness(1)' };

/** Keys that activate a native `<button>`, and so have to animate like a press. */
const PRESS_KEYS = ['Enter', ' '];

/** DOM props that keep one button's press state in step with the user. */
interface PressHandlers {
  onPointerDown: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onKeyUp: () => void;
  onBlur: () => void;
}

/**
 * Tracks whether one button is being held down — by mouse, touch or keyboard,
 * since a native `<button>` also activates with Enter and Space.
 *
 * Framer Motion's `whileTap` covers the pointer case on its own, but it
 * synthesises a `PointerEvent` for keyboard activation, which jsdom does not
 * implement — that surfaces as an uncaught error in every consumer test that
 * confirms with the keyboard. Owning the state keeps the animation identical
 * and the DOM contract plain.
 */
function usePressState(): [boolean, PressHandlers] {
  const [pressed, setPressed] = React.useState(false);
  const release = React.useCallback(() => setPressed(false), []);

  // The release is watched on the window, not the button: a pointer let go
  // outside the button, or on a button the confirm has just disabled, still has
  // to end the press instead of leaving it stuck down.
  React.useEffect(() => {
    if (!pressed) return;
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [pressed, release]);

  const handlers = React.useMemo<PressHandlers>(
    () => ({
      onPointerDown: () => setPressed(true),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (PRESS_KEYS.includes(event.key)) setPressed(true);
      },
      onKeyUp: release,
      onBlur: release,
    }),
    [release],
  );

  return [pressed, handlers];
}

/**
 * The Ok/Cancel button pair every screen can drop into a dialog, form footer or
 * inline panel to get consistent confirm/cancel actions.
 *
 * Ok comes first and Cancel second in both the DOM and the visual order, so
 * tabbing follows what the user sees. Both are plain MUI `Button`s, which keeps
 * the native `<button>` behaviour intact: they are keyboard-focusable and
 * activate with Enter and Space. Labelling and focus trapping stay the
 * responsibility of the host (e.g. `AnimatedDialog`).
 *
 * An `onOk` that returns a promise puts the confirm button in a busy state for
 * as long as that promise is in flight, so a slow confirm cannot be submitted
 * twice. A host that owns the async state itself can drive the same busy state
 * with `pending` instead; the two are additive.
 *
 * Both buttons play a Framer Motion press animation while they are held down, by
 * mouse, touch or keyboard alike. It is purely visual: `onOk`/`onCancel` still
 * fire from the click, so nothing ever waits on the animation, and Framer Motion
 * interpolates from wherever the previous press got to, so hammering a button
 * restarts the press instead of leaving it stuck. `prefers-reduced-motion` and
 * `duration={0}` replace the movement with an instant shade change, leaving the
 * labels, the callbacks and everything else untouched; `pressVariant="none"`
 * leaves MUI's ripple as the only feedback.
 */
export const ConfirmActions = React.forwardRef<HTMLDivElement, ConfirmActionsProps>(
  function ConfirmActions(
    {
      onOk,
      onCancel,
      confirmLabel = DEFAULT_CONFIRM_LABEL,
      cancelLabel = DEFAULT_CANCEL_LABEL,
      emphasis = 'high',
      destructive = false,
      pending,
      disableConfirm = false,
      disableCancel = false,
      align = 'right',
      pressVariant = DEFAULT_PRESS_VARIANT,
      duration = DEFAULT_PRESS_DURATION,
      easing = DEFAULT_EASING,
      fullWidth = false,
      okButtonProps,
      cancelButtonProps,
      ...stackProps
    },
    ref,
  ) {
    const [awaitingOk, setAwaitingOk] = React.useState(false);
    const prefersReducedMotion = useReducedMotion();
    const [okPressed, okPressHandlers] = usePressState();
    const [cancelPressed, cancelPressHandlers] = usePressState();

    // A promise still in flight and a host-controlled `pending` are two sources
    // of the same state, so either one is enough to mark the button busy.
    const busy = pending === true || awaitingOk;

    // The promise can outlive the buttons — a confirm that closes its dialog is
    // the normal case — so only touch state while still mounted.
    const mountedRef = React.useRef(true);
    React.useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const handleOk = () => {
      // Belt and braces next to `disabled`: a caller can re-enable the button
      // through `okButtonProps`, and Enter held down can repeat the click
      // before React has painted the busy state.
      if (busy) return;

      const result = onOk();
      if (!isPromiseLike(result)) return;

      setAwaitingOk(true);
      const settle = () => {
        if (mountedRef.current) setAwaitingOk(false);
      };
      result.then(settle, (error: unknown) => {
        // Leaving the button stuck busy would strand the user, but swallowing
        // the rejection would hide a failed confirm — so release and rethrow,
        // exactly as the unawaited handler would have failed before.
        settle();
        throw error;
      });
    };

    // Reserving the icon slot whenever `pending` is controlled keeps the button
    // the same width in both states, so toggling it never shifts the layout.
    // A tracked promise reserves it for as long as it runs; callers that want
    // no shift at all on an async confirm can pass `pending={false}`.
    const reserveSpinnerSlot = pending !== undefined || awaitingOk;

    // Reduced motion — and a zero-length press, which would snap to the target
    // and back rather than move — keeps the press feedback but swaps the
    // movement for an instant shade change. Only `pressVariant="none"` opts out
    // altogether, leaving MUI's ripple as the only feedback.
    const motionFree = Boolean(prefersReducedMotion) || duration <= 0;
    const pressTarget =
      pressVariant === 'none' ? undefined : motionFree ? PRESS_SHADE : PRESS_TARGETS[pressVariant];
    const pressRest = motionFree ? PRESS_SHADE_REST : PRESS_REST;
    const pressTransition = buildMotionTransition(duration, easing, prefersReducedMotion);

    /**
     * Motion props for one button. Nothing here touches the click path, so the
     * press animation can never delay `onOk`/`onCancel`.
     */
    const pressProps = (pressed: boolean): Pick<MotionButtonProps, 'animate' | 'transition'> =>
      pressTarget
        ? { animate: pressed ? pressTarget : pressRest, transition: pressTransition }
        : {};

    return (
      <Stack
        ref={ref}
        direction="row"
        spacing={1}
        justifyContent={JUSTIFY_CONTENT[align]}
        {...stackProps}
        // Array form so a caller's own `sx` composes with `fullWidth` instead of
        // replacing it.
        sx={[
          fullWidth ? { width: '100%' } : false,
          ...(Array.isArray(stackProps.sx) ? stackProps.sx : [stackProps.sx]),
        ]}
      >
        <MotionButton
          {...okPressHandlers}
          {...pressProps(okPressed)}
          variant={emphasis === 'high' ? 'contained' : 'outlined'}
          color={destructive ? 'error' : 'primary'}
          onClick={handleOk}
          disabled={disableConfirm || busy}
          aria-busy={busy ? true : undefined}
          fullWidth={fullWidth}
          startIcon={
            reserveSpinnerSlot ? (
              <span
                style={{
                  display: 'inline-flex',
                  width: SPINNER_SIZE,
                  height: SPINNER_SIZE,
                }}
              >
                {busy ? <CircularProgress size={SPINNER_SIZE} color="inherit" /> : null}
              </span>
            ) : undefined
          }
          {...okButtonProps}
        >
          {confirmLabel}
        </MotionButton>
        <MotionButton
          {...cancelPressHandlers}
          {...pressProps(cancelPressed)}
          variant="text"
          color="inherit"
          onClick={onCancel}
          disabled={disableCancel}
          fullWidth={fullWidth}
          {...cancelButtonProps}
        >
          {cancelLabel}
        </MotionButton>
      </Stack>
    );
  },
);

export default ConfirmActions;
