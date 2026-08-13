import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatedDialog } from '../AnimatedDialog';
import { ConfirmActions } from './ConfirmActions';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on. Reduced motion also collapses
 * both transitions to zero, so the dialog reaches its open and closed states
 * without waiting on animation frames.
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
 * The confirmation flow as the AnimatedDialog story composes it: a trigger
 * button on the host surface, and a dialog whose footer is the shared Ok/Cancel
 * pair rather than a hand-rolled one. `autoFocus` on the confirm button is the
 * only focus work the host does — the rest comes from MUI's focus trap.
 */
function ConfirmFlow({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Publish release</Button>
      <AnimatedDialog open={open} onClose={close}>
        <DialogTitle>Publish release?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This pushes the current build to production. You can roll back afterwards.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <ConfirmActions
            confirmLabel="Publish"
            onOk={() => {
              onConfirm();
              close();
            }}
            onCancel={close}
            okButtonProps={{ autoFocus: true }}
          />
        </DialogActions>
      </AnimatedDialog>
    </>
  );
}

/** Renders the flow and opens the dialog from its trigger, as a user would. */
async function openFlow(onConfirm = vi.fn()) {
  mockReducedMotion();
  const user = userEvent.setup();
  render(<ConfirmFlow onConfirm={onConfirm} />);

  const trigger = screen.getByRole('button', { name: 'Publish release' });
  await user.click(trigger);
  await screen.findByRole('dialog');

  return { user, trigger, onConfirm };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ConfirmActions in a confirmation dialog', () => {
  it('renders the shared pair in the dialog footer, confirm first', async () => {
    await openFlow();

    // Only the dialog's own buttons: MUI hides the trigger from the
    // accessibility tree for as long as the modal is open.
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Publish', 'Cancel']);
  });

  it('moves focus to the confirm button when the dialog opens', async () => {
    await openFlow();

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Publish' })),
    );
  });

  it('dismisses on Cancel with no side effects and returns focus to the trigger', async () => {
    const { user, trigger, onConfirm } = await openFlow();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('dismisses on Esc with no side effects and returns focus to the trigger', async () => {
    const { user, trigger, onConfirm } = await openFlow();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('runs the confirm action on Ok and closes the dialog', async () => {
    const { user, trigger, onConfirm } = await openFlow();

    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('confirms from the keyboard, since focus already sits on Ok', async () => {
    const { user, onConfirm } = await openFlow();

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Publish' })),
    );
    await user.keyboard('{Enter}');

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
