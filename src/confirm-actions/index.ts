export { ConfirmActions, default as ConfirmActionsDefault } from './ConfirmActions';
export type {
  ConfirmActionsProps,
  ConfirmActionsAlign,
  ConfirmActionsEasing,
  ConfirmActionsEmphasis,
  ConfirmActionsPressVariant,
} from './types';

/**
 * `OkCancelButtons` is the same component under the name screens reach for when
 * they want "the Ok/Cancel pair" rather than "the confirm actions". It is an
 * alias, not a second implementation: one pair, one set of defaults, one place
 * to change them.
 */
export { ConfirmActions as OkCancelButtons } from './ConfirmActions';
export type { ConfirmActionsProps as OkCancelButtonsProps } from './types';
