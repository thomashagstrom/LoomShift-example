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

/** Anything with a `then` is close enough: we only ever await the result. */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
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
    const [awaitingOk, setAwaitingOk] = React.useState(false);

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
