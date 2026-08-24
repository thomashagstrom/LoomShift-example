import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatedDialog } from './AnimatedDialog';
import type { AnimatedDialogProps } from './AnimatedDialog';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on. Reduced motion also collapses
 * the dialog transition to zero, so it reaches its open and closed states
 * without waiting on animation frames. The press animation itself is asserted
 * with motion left on, in `AnimatedDialog.confirmActions.fullMotion.test.tsx`.
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
 * The dialog driven by its own Ok/Cancel props, with the host state a consumer
 * would own: `onClose` is the only thing that takes the dialog down, whatever
 * reason it is given.
 */
function ConfirmDialog(props: Partial<AnimatedDialogProps>) {
  const [open, setOpen] = React.useState(true);

  return (
    <AnimatedDialog
      open={open}
      {...props}
      onClose={(event, reason) => {
        setOpen(false);
        props.onClose?.(event, reason);
      }}
    >
      <DialogTitle>Publish release?</DialogTitle>
      <DialogContentText>This pushes the current build to production.</DialogContentText>
    </AnimatedDialog>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedDialog Ok/Cancel footer', () => {
  it('renders the shared pair as the footer, Ok first, when given onConfirm', () => {
    mockReducedMotion();
    render(<ConfirmDialog onConfirm={vi.fn()} onCancel={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Ok', 'Cancel']);
  });

  it('renders no footer when neither callback is given', () => {
    mockReducedMotion();
    render(<ConfirmDialog />);

    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('focuses Ok as the dialog opens', async () => {
    mockReducedMotion();
    render(<ConfirmDialog onConfirm={vi.fn()} />);

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ok' })),
    );
  });

  it('invokes onConfirm and then closes the dialog', async () => {
    mockReducedMotion();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog onConfirm={onConfirm} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Ok' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'confirm');
    // The callback runs first: a host that publishes on confirm must not have
    // to race the dialog's own teardown.
    expect(onConfirm.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0],
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('invokes onCancel and then closes the dialog', async () => {
    mockReducedMotion();
    const onCancel = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog onConfirm={vi.fn()} onCancel={onCancel} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'cancel');
    expect(onCancel.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0],
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes on Cancel even when only onConfirm is given', async () => {
    mockReducedMotion();
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("still reports MUI's own close reasons, so Esc is not mistaken for a cancel", async () => {
    mockReducedMotion();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog onConfirm={vi.fn()} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'escapeKeyDown');
  });

  it('passes footer options such as labels through confirmActionsProps', () => {
    mockReducedMotion();
    render(
      <ConfirmDialog
        onConfirm={vi.fn()}
        confirmActionsProps={{ confirmLabel: 'Publish', cancelLabel: 'Not now' }}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Publish', 'Not now']);
  });

  it('keeps the dialog open and Ok busy until an async confirm resolves', async () => {
    mockReducedMotion();
    let settle = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog onConfirm={onConfirm} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Ok' }));

    const ok = screen.getByRole('button', { name: 'Ok' });
    expect(ok.getAttribute('aria-busy')).toBe('true');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();

    await act(async () => {
      settle();
    });

    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'confirm');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
