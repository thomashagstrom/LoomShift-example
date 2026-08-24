/**
 * The Ok/Cancel pair dialogs and forms reuse, published under its own subpath
 * export.
 *
 * The behaviour asked of it — an Ok and a Cancel button with configurable
 * labels, independent `onOk`/`onCancel` callbacks, independent disabling and
 * plain keyboard-operable `<button>`s — is exactly what the `ConfirmActions`
 * slice already renders. Re-exporting it under this name gives hosts the
 * component without a second implementation to keep in step: one set of
 * defaults, one press animation, one busy state.
 */
export {
  ConfirmActions as OkCancelButtons,
  default as OkCancelButtonsDefault,
} from '../confirm-actions/ConfirmActions';
export type {
  OkCancelButtonsProps,
  OkCancelButtonsAlign,
  OkCancelButtonsEasing,
  OkCancelButtonsEmphasis,
  OkCancelButtonsPressVariant,
} from './types';
