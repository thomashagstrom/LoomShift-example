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
import { ConfirmActions } from '../confirm-actions/ConfirmActions';
import { AnimatedStack } from './AnimatedStack';
import { GRADIENT_REST } from './gradient';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on. Reduced motion also collapses
 * both the dialog transition and the stack's enter animation to zero, so the
 * composed surface reaches its open and closed states without waiting on
 * animation frames.
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
 * The dialog as the `WithAnimatedStack` story composes it: a single
 * `AnimatedStack` is the dialog's container, and the title, body and the shared
 * Ok/Cancel pair are its direct flex items rather than bare siblings of the
 * dialog paper. `open` is the only thing the host drives.
 */
function PublishFlow({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Publish release</Button>
      <AnimatedDialog open={open} onClose={close} aria-labelledby="publish-title">
        <AnimatedStack data-testid="dialog-stack" direction="column" spacing={1}>
          <DialogTitle id="publish-title">Publish release?</DialogTitle>
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
        </AnimatedStack>
      </AnimatedDialog>
    </>
  );
}

/** Renders the flow and opens the dialog from its trigger, as a user would. */
async function openFlow(onConfirm = vi.fn()) {
  mockReducedMotion();
  const user = userEvent.setup();
  render(<PublishFlow onConfirm={onConfirm} />);

  const trigger = screen.getByRole('button', { name: 'Publish release' });
  await user.click(trigger);
  await screen.findByRole('dialog');

  return { user, trigger, onConfirm };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedStack as the AnimatedDialog container', () => {
  it('renders the dialog content inside the stack, as its direct flex items', async () => {
    await openFlow();

    const stack = screen.getByTestId('dialog-stack');
    expect(screen.getByRole('dialog').contains(stack)).toBe(true);
    expect(getComputedStyle(stack).flexDirection).toBe('column');
    // Title, body and actions in order: the stack arranges them itself, so they
    // have to be its own children rather than nested somewhere below it.
    expect(Array.from(stack.children).map((child) => child.textContent)).toEqual([
      'Publish release?',
      'This pushes the current build to production. You can roll back afterwards.',
      'PublishCancel',
    ]);
  });

  it('renders whatever children the dialog is given', async () => {
    mockReducedMotion();
    render(
      <AnimatedDialog open>
        <AnimatedStack data-testid="dialog-stack">
          <p>Arbitrary body</p>
        </AnimatedStack>
      </AnimatedDialog>,
    );

    expect(screen.getByTestId('dialog-stack').textContent).toBe('Arbitrary body');
  });

  it('shows and hides the composed content with the open prop', async () => {
    mockReducedMotion();
    const { rerender } = render(
      <AnimatedDialog open={false}>
        <AnimatedStack data-testid="dialog-stack">
          <p>Toggled body</p>
        </AnimatedStack>
      </AnimatedDialog>,
    );

    expect(screen.queryByTestId('dialog-stack')).toBeNull();

    rerender(
      <AnimatedDialog open>
        <AnimatedStack data-testid="dialog-stack">
          <p>Toggled body</p>
        </AnimatedStack>
      </AnimatedDialog>,
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Toggled body')).toBeTruthy();

    rerender(
      <AnimatedDialog open={false}>
        <AnimatedStack data-testid="dialog-stack">
          <p>Toggled body</p>
        </AnimatedStack>
      </AnimatedDialog>,
    );

    await waitFor(() => expect(screen.queryByTestId('dialog-stack')).toBeNull());
  });

  it('paints the stack surface behind the dialog content', async () => {
    await openFlow();

    // The gradient stays under reduced motion — it is colour, not movement —
    // so the composed dialog looks finished without a prop of its own.
    const style = getComputedStyle(screen.getByTestId('dialog-stack'));
    expect(style.backgroundImage).toContain('linear-gradient');
    expect(style.backgroundPosition).toBe(GRADIENT_REST);
  });

  it('keeps the dialog labelling and focus behaviour the stack now wraps', async () => {
    const { user, trigger } = await openFlow();

    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBe('publish-title');
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Publish' })),
    );

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
