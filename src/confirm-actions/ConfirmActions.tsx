import * as React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import type { ConfirmActionsAlign, ConfirmActionsProps } from './types';

const DEFAULT_CONFIRM_LABEL = 'Ok';
const DEFAULT_CANCEL_LABEL = 'Cancel';

/** Diameter of the pending spinner, in pixels. */
const SPINNER_SIZE = 16;

const JUSTIFY_CONTENT: Record<ConfirmActionsAlign, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

/**
 * The Ok/Cancel button pair every screen can drop into a dialog, form footer or
 * inline panel to get consistent confirm/cancel actions.
 *
 * Ok comes first and Cancel second in both the DOM and the visual order, so
 * tabbing follows what the user sees. Both are plain MUI `Button`s, which keeps
 * the native `<button>` behaviour intact: they are keyboard-focusable and
 * activate with Enter and Space. Labelling and focus trapping stay the
 * responsibility of the host (e.g. `AnimatedDialog`), and the host also owns the
 * async state behind `pending` — this component only renders it.
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
      align = 'right',
      fullWidth = false,
      okButtonProps,
      cancelButtonProps,
      ...stackProps
    },
    ref,
  ) {
    // Reserving the icon slot whenever `pending` is controlled keeps the button
    // the same width in both states, so toggling it never shifts the layout.
    // Uncontrolled callers get a button with no leading gap.
    const reserveSpinnerSlot = pending !== undefined;

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
        <Button
          variant={emphasis === 'high' ? 'contained' : 'outlined'}
          color={destructive ? 'error' : 'primary'}
          onClick={onOk}
          disabled={disableConfirm || pending === true}
          aria-busy={pending === true ? true : undefined}
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
                {pending ? <CircularProgress size={SPINNER_SIZE} color="inherit" /> : null}
              </span>
            ) : undefined
          }
          {...okButtonProps}
        >
          {confirmLabel}
        </Button>
        <Button
          variant="text"
          color="inherit"
          onClick={onCancel}
          fullWidth={fullWidth}
          {...cancelButtonProps}
        >
          {cancelLabel}
        </Button>
      </Stack>
    );
  },
);

export default ConfirmActions;
