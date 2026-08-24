import type {
  ConfirmActionsAlign,
  ConfirmActionsEasing,
  ConfirmActionsEmphasis,
  ConfirmActionsPressVariant,
  ConfirmActionsProps,
} from '../confirm-actions/types';

/**
 * Props of the Ok/Cancel pair. Identical to `ConfirmActionsProps`, which this
 * slice publishes under the `OkCancelButtons` name — see `./index.ts`.
 */
export type OkCancelButtonsProps = ConfirmActionsProps;

/** Visual weight of the Ok button. */
export type OkCancelButtonsEmphasis = ConfirmActionsEmphasis;

/** Horizontal placement of the pair within its container. */
export type OkCancelButtonsAlign = ConfirmActionsAlign;

/** Press feedback played on both buttons while they are held down. */
export type OkCancelButtonsPressVariant = ConfirmActionsPressVariant;

/** Easing accepted by Framer Motion (named curve, cubic-bezier array, …). */
export type OkCancelButtonsEasing = ConfirmActionsEasing;
