import type { ButtonProps } from '@mui/material/Button';
import type { StackProps } from '@mui/material/Stack';
import type { MotionEasing } from '../shared/animation';

/**
 * How strongly the confirm button is styled. `'high'` renders it `contained`
 * (the default, for the primary action on a screen), `'low'` renders it
 * `outlined` for secondary placements such as an inline form footer.
 */
export type ConfirmActionsEmphasis = 'high' | 'low';

/** Horizontal placement of the pair within its container. */
export type ConfirmActionsAlign = 'left' | 'center' | 'right';

/**
 * Press feedback played on both buttons while they are held down. `'scale'`
 * sinks the button slightly, `'lift'` presses it down towards the surface, and
 * `'none'` leaves MUI's own ripple as the only feedback.
 */
export type ConfirmActionsPressVariant = 'scale' | 'lift' | 'none';

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type ConfirmActionsEasing = MotionEasing;

export interface ConfirmActionsProps
  extends Omit<StackProps, 'children' | 'direction' | 'justifyContent'> {
  /**
   * Fired once per click of the Ok button. Return the promise of an async
   * confirm and the button tracks it: it goes busy for as long as the promise
   * is in flight, and ignores clicks until it settles.
   */
  onOk: () => void | PromiseLike<unknown>;
  /** Fired once per click of the Cancel button. */
  onCancel: () => void;
  /** Label of the confirm button. Defaults to `'Ok'`. */
  confirmLabel?: string;
  /** Label of the cancel button. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Visual weight of the confirm button. Defaults to `'high'`. */
  emphasis?: ConfirmActionsEmphasis;
  /** Colours the confirm button as a destructive action. Defaults to `false`. */
  destructive?: boolean;
  /**
   * Shows a spinner on the confirm button and blocks further clicks while the
   * host resolves the action. Cancel stays interactive. Only needed when the
   * host owns the async state itself — an `onOk` that returns a promise drives
   * the same busy state on its own. The two are additive: whichever says busy
   * wins.
   */
  pending?: boolean;
  /** Disables the confirm button, e.g. while a form is invalid. */
  disableConfirm?: boolean;
  /** Horizontal placement of the pair. Defaults to `'right'`. */
  align?: ConfirmActionsAlign;
  /**
   * Press feedback animation played on both buttons. Defaults to `'scale'`;
   * `'none'` (or `duration={0}`, or a reduced-motion preference) leaves the
   * ripple as the only feedback.
   */
  pressVariant?: ConfirmActionsPressVariant;
  /** Press animation duration in milliseconds. Defaults to `120`. */
  duration?: number;
  /** Framer Motion easing curve for the press. Defaults to `'easeInOut'`. */
  easing?: ConfirmActionsEasing;
  /** Stretches both buttons to share the full width of the container. */
  fullWidth?: boolean;
  /** Escape hatch for the confirm button, e.g. `type="submit"`. */
  okButtonProps?: ButtonProps;
  /** Escape hatch for the cancel button. */
  cancelButtonProps?: ButtonProps;
}
