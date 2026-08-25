import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import type { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import type { TransitionProps } from '@mui/material/transitions';
import { motion, useReducedMotion } from 'framer-motion';
import type {
  AnimationDefinition,
  Transition as MotionTransitionConfig,
  Variants,
} from 'framer-motion';
import { ConfirmActions } from './confirm-actions/ConfirmActions';
import type { ConfirmActionsProps } from './confirm-actions/types';
import {
  DEFAULT_DURATION,
  DEFAULT_EASING,
  buildMotionTransition,
  type MotionEasing,
} from './shared/animation';
import { isPromiseLike } from './shared/promise';

/**
 * Built-in enter/exit animations. `variant` is fully optional on
 * {@link AnimatedDialog} and defaults to `'zoom'`.
 */
export type AnimatedDialogVariant = 'fade' | 'zoom' | 'slide-up' | 'slide-down';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type AnimatedDialogEasing = MotionEasing;

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
        style={{ height: '100%', outline: 'none', ...style }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

/**
 * Why the dialog is asking to close: MUI's own reasons, plus the three the
 * dialog's own chrome adds — the footer's two actions and the header's × — so a
 * host can tell a confirm from a plain dismissal.
 */
export type AnimatedDialogCloseReason =
  | Parameters<NonNullable<DialogProps['onClose']>>[1]
  | 'confirm'
  | 'cancel'
  | 'closeButton';

const DEFAULT_CLOSE_BUTTON_LABEL = 'Close';

export interface AnimatedDialogProps extends Omit<DialogProps, 'TransitionComponent' | 'onClose'> {
  /** Enter/exit animation preset. Defaults to `'zoom'`. */
  variant?: AnimatedDialogVariant;
  /** Animation duration in milliseconds. Defaults to `250`. */
  duration?: number;
  /** Framer Motion easing curve. Defaults to `'easeInOut'`. */
  easing?: AnimatedDialogEasing;
  /**
   * Fired once per confirm. Passing it — or {@link AnimatedDialogProps.onCancel}
   * — renders the shared Ok/Cancel pair as the dialog's footer.
   *
   * Return the promise of an async confirm and the Ok button stays busy until
   * it settles: the dialog closes once it resolves, and stays open if it
   * rejects, so the user can read the failure and retry.
   */
  onConfirm?: () => void | PromiseLike<unknown>;
  /** Fired once per cancel, before the dialog closes. */
  onCancel?: () => void;
  /**
   * Escape hatch for the built-in footer — labels, `destructive`, `pressVariant`
   * and the rest of {@link ConfirmActionsProps}. The two callbacks stay owned by
   * the dialog, which is what lets it close itself afterwards.
   */
  confirmActionsProps?: Omit<ConfirmActionsProps, 'onOk' | 'onCancel'>;
  /**
   * Ignore clicks on the backdrop, so the dialog can only be left through one of
   * its own actions. The keyboard counterpart is MUI's `disableEscapeKeyDown`.
   * Defaults to `false` — outside clicks dismiss.
   */
  disableBackdropDismiss?: boolean;
  /**
   * Drop the × button from the dialog's header, for a header that carries its
   * own close affordance. Defaults to `false` — the button is there for as long
   * as the dialog is open.
   */
  hideCloseButton?: boolean;
  /**
   * Accessible label of the header's × button, since the glyph itself says
   * nothing to a screen reader. Defaults to `'Close'`.
   */
  closeButtonLabel?: string;
  /**
   * Callback fired when the dialog requests to be closed. Widens MUI's `reason`
   * with `'confirm'` and `'cancel'` for the built-in footer's two actions.
   */
  onClose?: (event: object, reason: AnimatedDialogCloseReason) => void;
}

/**
 * A MUI `Dialog` that animates its enter/exit with Framer Motion out of the box.
 *
 * All MUI `Dialog` props are supported and forwarded, so accessibility roles
 * (`role="dialog"`, `aria-modal`, labelling) and focus trapping are preserved.
 * Users who set `prefers-reduced-motion` get an instant, motion-free transition.
 *
 * Pass `onConfirm`/`onCancel` and the dialog appends the shared
 * {@link ConfirmActions} pair — Ok first, Cancel second, both with the press
 * animation — as its footer, and closes itself through `onClose` once the
 * matching callback has run. Hosts that want a different footer keep composing
 * their own `DialogActions` in `children` instead; the two never both appear.
 *
 * A click on the backdrop or a press of Esc asks to close the same way, with a
 * reason of `'backdropClick'` or `'escapeKeyDown'`, and MUI's focus trap hands
 * focus back to the element that opened the dialog. Set
 * {@link AnimatedDialogProps.disableBackdropDismiss} or MUI's
 * `disableEscapeKeyDown` to turn either one off for a dialog that must be
 * answered.
 *
 * Neither of those two routes is visible, so the dialog also puts a × button in
 * the corner of its header — a close that can be seen, pointed at and tabbed to,
 * reporting a reason of `'closeButton'`. Hide it with
 * {@link AnimatedDialogProps.hideCloseButton}.
 */
export const AnimatedDialog = React.forwardRef<HTMLDivElement, AnimatedDialogProps>(
  function AnimatedDialog(
    {
      variant = DEFAULT_VARIANT,
      duration = DEFAULT_DURATION,
      easing = DEFAULT_EASING,
      TransitionProps: transitionProps,
      onConfirm,
      onCancel,
      onClose,
      confirmActionsProps,
      disableBackdropDismiss = false,
      hideCloseButton = false,
      closeButtonLabel = DEFAULT_CLOSE_BUTTON_LABEL,
      children,
      ...dialogProps
    },
    ref,
  ) {
    const hasConfirmActions = Boolean(onConfirm ?? onCancel);

    // Every close request funnels through here, MUI's own dismissals included,
    // so a dialog that opts out of backdrop dismissal never reaches the host
    // with that reason. Esc opts out through MUI's `disableEscapeKeyDown`,
    // which stops the event before it ever becomes a close request.
    const handleClose = (event: object, reason: AnimatedDialogCloseReason) => {
      if (reason === 'backdropClick' && disableBackdropDismiss) {
        return;
      }
      onClose?.(event, reason);
    };

    // The dialog is controlled, so closing it means asking the host to. The
    // reason names the action that got us here, which is all a host needs to
    // tell an accepted dialog from a dismissed one.
    const requestClose = (reason: AnimatedDialogCloseReason) => handleClose({}, reason);

    const handleOk = () => {
      const result = onConfirm?.();
      if (!isPromiseLike(result)) {
        requestClose('confirm');
        return;
      }

      // Handing the promise back keeps the Ok button busy for as long as the
      // confirm runs. A rejection propagates untouched — it leaves the dialog
      // open and surfaces the same way any other failed async confirm does.
      return result.then((value) => {
        requestClose('confirm');
        return value;
      });
    };

    const handleCancel = () => {
      onCancel?.();
      requestClose('cancel');
    };

    return (
      <Dialog
        ref={ref}
        onClose={handleClose}
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
      >
        {hideCloseButton ? null : (
          // Pinned to the corner of the paper rather than laid out in the flow,
          // so it sits in the header whatever the host composes there — a
          // `DialogTitle`, an `AnimatedStack`, or nothing at all.
          <IconButton
            aria-label={closeButtonLabel}
            onClick={() => requestClose('closeButton')}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            {/* The glyph is decorative; `aria-label` above is the name. */}
            <span aria-hidden="true" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              &times;
            </span>
          </IconButton>
        )}
        {children}
        {hasConfirmActions ? (
          <DialogActions>
            <ConfirmActions
              {...confirmActionsProps}
              onOk={handleOk}
              onCancel={handleCancel}
              // Focus lands on Ok as the dialog opens; MUI's focus trap hands it
              // back to the trigger on close.
              okButtonProps={{ autoFocus: true, ...confirmActionsProps?.okButtonProps }}
            />
          </DialogActions>
        ) : null}
      </Dialog>
    );
  },
);

export default AnimatedDialog;
