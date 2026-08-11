import type { ButtonProps } from '@mui/material/Button';
import type { StackProps } from '@mui/material/Stack';

/**
 * How strongly the confirm button is styled. `'high'` renders it `contained`
 * (the default, for the primary action on a screen), `'low'` renders it
 * `outlined` for secondary placements such as an inline form footer.
 */
export type ConfirmActionsEmphasis = 'high' | 'low';

/** Horizontal placement of the pair within its container. */
export type ConfirmActionsAlign = 'left' | 'center' | 'right';

export interface ConfirmActionsProps
  extends Omit<StackProps, 'children' | 'direction' | 'justifyContent'> {
  /** Fired once per click of the Ok button. */
  onOk: () => void;
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
   * host resolves the action. Cancel stays interactive.
   */
  pending?: boolean;
  /** Disables the confirm button, e.g. while a form is invalid. */
  disableConfirm?: boolean;
  /** Horizontal placement of the pair. Defaults to `'right'`. */
  align?: ConfirmActionsAlign;
  /** Stretches both buttons to share the full width of the container. */
  fullWidth?: boolean;
  /** Escape hatch for the confirm button, e.g. `type="submit"`. */
  okButtonProps?: ButtonProps;
  /** Escape hatch for the cancel button. */
  cancelButtonProps?: ButtonProps;
}
