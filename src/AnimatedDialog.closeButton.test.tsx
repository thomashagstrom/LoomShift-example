import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@mui/material/Button';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatedDialog } from './AnimatedDialog';
import type { AnimatedDialogProps } from './AnimatedDialog';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on. Reduced motion also collapses
 * the dialog transition to zero, so the dialog reaches its closed state — and
 * unmounts, which is what hands focus back — without waiting on animation
 * frames.
 */
function mockReducedMotion(): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

/**
 * The dialog with the host state a consumer would own, opened from a real
 * trigger button so focus has somewhere to return to.
 */
function ClosableDialog(props: Partial<AnimatedDialogProps>) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <AnimatedDialog
        {...props}
        open={open}
        onClose={(event, reason) => {
          setOpen(false);
          props.onClose?.(event, reason);
        }}
      >
        <DialogTitle>Publish release?</DialogTitle>
        <DialogContentText>This pushes the current build to production.</DialogContentText>
      </AnimatedDialog>
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedDialog close button', () => {
  it('shows a labelled close button inside the dialog while it is open', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    const close = within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' });
    expect(close.textContent).toBe('×');
  });

  it('closes and reports closeButton when the user clicks it', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ClosableDialog onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'closeButton');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('returns focus to the triggering element after closing from the button', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog />);

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('leaves the confirm callbacks alone when it closes', async () => {
    mockReducedMotion();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ClosableDialog onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('relabels the button for hosts that speak another language', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog closeButtonLabel="Stäng" />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Stäng' })).toBeTruthy();
  });

  it('drops the button when the host hides it', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog hideCloseButton />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
