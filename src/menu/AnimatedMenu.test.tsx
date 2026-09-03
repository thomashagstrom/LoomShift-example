import * as React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuItem from '@mui/material/MenuItem';
import { AnimatedMenu } from './AnimatedMenu';
import { DEFAULT_DURATION, DEFAULT_EASING } from '../shared/animation';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on, so tests must provide it.
 */
function mockReducedMotion(prefersReduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: query.includes('prefers-reduced-motion') ? prefersReduced : false,
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

/** A trigger button used as `anchorEl`, standing in for "any element". */
function TriggerAndMenu(props: { open: boolean; onClose?: () => void }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <div>
      <button ref={setAnchorEl} type="button">
        Open menu
      </button>
      <AnimatedMenu anchorEl={anchorEl} open={props.open} onClose={props.onClose}>
        <MenuItem onClick={props.onClose}>Profile</MenuItem>
        <MenuItem onClick={props.onClose}>Logout</MenuItem>
      </AnimatedMenu>
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedMenu', () => {
  it('renders its items when open', () => {
    render(<TriggerAndMenu open />);
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<TriggerAndMenu open={false} />);
    expect(screen.queryByText('Profile')).toBeNull();
  });

  it('accepts animationVariant, duration and easing prop overrides without error', () => {
    mockReducedMotion(false);
    render(
      <AnimatedMenu
        open
        anchorEl={document.body}
        animationVariant="grow"
        duration={500}
        easing="linear"
      >
        <MenuItem>Custom</MenuItem>
      </AnimatedMenu>,
    );
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    render(
      <AnimatedMenu open anchorEl={document.body}>
        <MenuItem>Reduced</MenuItem>
      </AnimatedMenu>,
    );
    expect(screen.getByText('Reduced')).toBeTruthy();
  });

  it('can be triggered from an arbitrary anchor element via anchorEl', () => {
    render(<TriggerAndMenu open />);
    // The anchor is a plain button — any element — set through `anchorEl`,
    // not a menu-specific trigger the component has to know about. MUI hides
    // content outside the open menu from the accessibility tree, so it is
    // queried with `hidden: true` rather than treated as unmounted.
    expect(screen.getByRole('button', { name: 'Open menu', hidden: true })).toBeTruthy();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('closes when the host wires a menu item onClick to onClose, as with MUI Menu', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TriggerAndMenu open onClose={onClose} />);

    await user.click(screen.getByText('Profile'));

    expect(onClose).toHaveBeenCalled();
  });

  it('drives the MUI transition lifecycle callbacks through Framer Motion', async () => {
    // Reduced motion collapses the duration to zero so the enter animation
    // completes synchronously, exercising the onEnter -> onEntered lifecycle
    // that bridges Framer Motion back to MUI's mount/unmount contract.
    mockReducedMotion(true);
    const onEnter = vi.fn();
    const onEntered = vi.fn();

    render(
      <AnimatedMenu open anchorEl={document.body} TransitionProps={{ onEnter, onEntered }}>
        <MenuItem>Lifecycle</MenuItem>
      </AnimatedMenu>,
    );

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());
  });

  it('unmounts closed content after the exit lifecycle completes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();
    const { rerender } = render(
      <AnimatedMenu open anchorEl={document.body} TransitionProps={{ onExited }}>
        <MenuItem>Closing</MenuItem>
      </AnimatedMenu>,
    );

    expect(screen.getByText('Closing')).toBeTruthy();

    rerender(
      <AnimatedMenu open={false} anchorEl={document.body} TransitionProps={{ onExited }}>
        <MenuItem>Closing</MenuItem>
      </AnimatedMenu>,
    );

    await waitFor(() => expect(onExited).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Closing')).toBeNull());
  });

  it('reuses the shared animation defaults established by the first component', () => {
    // The slice must not fork its own magic numbers; it consumes the shared
    // tokens so the whole library animates consistently.
    expect(DEFAULT_DURATION).toBe(250);
    expect(DEFAULT_EASING).toBe('easeInOut');
  });
});
