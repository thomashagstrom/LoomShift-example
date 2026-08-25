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
function DismissibleDialog(props: Partial<AnimatedDialogProps>) {
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

/** The centering container that sits over the backdrop — what a user clicks. */
function backdropOf(dialog: HTMLElement): HTMLElement {
  const container = dialog.parentElement;
  if (!container) {
    throw new Error('Dialog is not mounted inside its container');
  }
  return container;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedDialog dismissal', () => {
  it('closes and reports backdropClick when the user clicks outside the dialog', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DismissibleDialog onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(backdropOf(screen.getByRole('dialog')));

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'backdropClick');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes and reports escapeKeyDown when the user presses Escape', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DismissibleDialog onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'escapeKeyDown');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('returns focus to the triggering element after a backdrop dismissal', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<DismissibleDialog />);

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.click(backdropOf(screen.getByRole('dialog')));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('returns focus to the triggering element after an Escape dismissal', async () => {
    mockReducedMotion();
    const user = userEvent.setup();
    render(<DismissibleDialog />);

    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('keeps the dialog open when the host disables backdrop dismissal', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DismissibleDialog onClose={onClose} disableBackdropDismiss />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(backdropOf(screen.getByRole('dialog')));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('keeps the dialog open when the host disables Escape dismissal', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DismissibleDialog onClose={onClose} disableEscapeKeyDown />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('still dismisses on Escape when only backdrop dismissal is disabled', async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DismissibleDialog onClose={onClose} disableBackdropDismiss />);

    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'escapeKeyDown');
  });
});
