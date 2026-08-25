import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
        showCloseButton
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
  it('renders a labelled close button inside the open dialog', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    const close = screen.getByRole('button', { name: 'Close' });
    expect(screen.getByRole('dialog').contains(close)).toBe(true);
  });

  it('is absent unless the host asks for it', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog showCloseButton={false} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
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

  it('returns focus to the triggering element after closing through it', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog />);

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('is reachable by keyboard and closes on Enter, since it is a native button', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ClosableDialog onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    // Focus opens on the paper, so one Tab inside the trap reaches the ×.
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));

    await user.keyboard('{Enter}');

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'closeButton');
  });

  it('lets the host relabel it for a translated UI', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<ClosableDialog closeButtonProps={{ 'aria-label': 'Stäng' }} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(screen.getByRole('button', { name: 'Stäng' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('closes a dialog that has opted out of backdrop and Escape dismissal', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ClosableDialog onClose={onClose} disableBackdropDismiss disableEscapeKeyDown />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'closeButton');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('sits alongside the built-in Ok/Cancel footer', async () => {
    mockReducedMotion();
    const onCancel = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ClosableDialog onConfirm={vi.fn()} onCancel={onCancel} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Ok' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Close' }));

    // Dismissing past the footer is not a cancel, and must not run its callback.
    expect(onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'closeButton');
  });
});
