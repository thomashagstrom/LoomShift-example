import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatedDialog } from './AnimatedDialog';
import { ConfirmActions } from './confirm-actions/ConfirmActions';
import { AnimatedSnackbar } from './snackbar/AnimatedSnackbar';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on. Reduced motion also collapses
 * both transitions to zero, so the dialog and the confirmation reach their open
 * and closed states without waiting on animation frames.
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
 * The publish flow as the AnimatedDialog story composes it, with local state
 * standing in for the story's args: the trigger opens the dialog, and confirming
 * closes it and leaves the confirmation behind on the page.
 */
function PublishFlow() {
  const [open, setOpen] = React.useState(false);
  const [published, setPublished] = React.useState(false);
  const close = () => setOpen(false);
  const dismissConfirmation = () => setPublished(false);
  const publish = () => {
    close();
    setPublished(true);
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
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
            onOk={publish}
            onCancel={close}
            okButtonProps={{ autoFocus: true }}
          />
        </DialogActions>
      </AnimatedDialog>
      <AnimatedSnackbar open={published} autoHideDuration={4000} onClose={dismissConfirmation}>
        <Alert severity="success" onClose={dismissConfirmation}>
          Release published
        </Alert>
      </AnimatedSnackbar>
    </>
  );
}

/** Renders the flow and opens the dialog from its trigger, as a user would. */
async function openFlow() {
  mockReducedMotion();
  const user = userEvent.setup();
  render(<PublishFlow />);

  await user.click(screen.getByRole('button', { name: 'Open dialog' }));
  await screen.findByRole('dialog');

  return { user };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedDialog publish flow', () => {
  it('opens a dialog titled "Publish release?" from the trigger', async () => {
    await openFlow();

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Publish release?')).toBeTruthy();
  });

  it('shows no confirmation before anything is published', async () => {
    await openFlow();

    expect(screen.queryByText('Release published')).toBeNull();
  });

  it('closes the dialog and confirms on the page when Publish is clicked', async () => {
    const { user } = await openFlow();

    await user.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText('Release published')).toBeTruthy();
  });
});
