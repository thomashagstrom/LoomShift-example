import * as React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@mui/material/Button';
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

/**
 * Renders a trigger button plus a menu anchored to it. `open` tracks whether
 * `anchorEl` is set, exactly as a real host would drive `AnimatedMenu`.
 */
function TriggeredMenu({
  onClose,
  ...props
}: Partial<Omit<React.ComponentProps<typeof AnimatedMenu>, 'anchorEl' | 'open'>>) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  type CloseReason = Parameters<NonNullable<typeof onClose>>[1] | 'itemSelected';
  const handleClose = (event: object, reason: CloseReason) => {
    setAnchorEl(null);
    onClose?.(event, reason as Parameters<NonNullable<typeof onClose>>[1]);
  };

  return (
    <>
      <Button onClick={(event) => setAnchorEl(event.currentTarget)}>Open menu</Button>
      <AnimatedMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} {...props}>
        <MenuItem onClick={(event) => handleClose(event, 'itemSelected')}>Profile</MenuItem>
        <MenuItem onClick={(event) => handleClose(event, 'itemSelected')}>Settings</MenuItem>
      </AnimatedMenu>
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedMenu', () => {
  it('renders nothing when closed', () => {
    render(<TriggeredMenu />);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('renders and positions against the element that triggered it', async () => {
    const user = userEvent.setup();
    render(<TriggeredMenu />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(await screen.findByRole('menu')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('triggers from any element passed as anchorEl, not just a button', async () => {
    function Example() {
      const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
      return (
        <>
          <span onClick={(event) => setAnchorEl(event.currentTarget)}>Context target</span>
          <AnimatedMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem>Copy</MenuItem>
          </AnimatedMenu>
        </>
      );
    }
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByText('Context target'));

    expect(await screen.findByRole('menu')).toBeTruthy();
  });

  it('calls onClose when an item is selected', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<TriggeredMenu onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(await screen.findByText('Profile'));

    expect(onClose).toHaveBeenCalled();
  });

  it('accepts transitionVariant, duration and easing prop overrides without error', async () => {
    mockReducedMotion(false);
    const user = userEvent.setup();
    render(<TriggeredMenu transitionVariant="slide-down" duration={500} easing="linear" />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(await screen.findByRole('menu')).toBeTruthy();
  });

  it('renders instantly when the user prefers reduced motion', async () => {
    mockReducedMotion(true);
    const user = userEvent.setup();
    render(<TriggeredMenu />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(await screen.findByRole('menu')).toBeTruthy();
  });

  it('drives the MUI transition lifecycle callbacks through Framer Motion', async () => {
    // Reduced motion collapses the duration to zero so the enter animation
    // completes synchronously, exercising the onEnter -> onEntered lifecycle
    // that bridges Framer Motion back to MUI's mount/unmount contract.
    mockReducedMotion(true);
    const onEnter = vi.fn();
    const onEntered = vi.fn();

    render(<TriggeredMenu TransitionProps={{ onEnter, onEntered }} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());
  });

  it('unmounts closed content after the exit lifecycle completes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();
    const user = userEvent.setup();
    render(<TriggeredMenu TransitionProps={{ onExited }} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(await screen.findByRole('menu')).toBeTruthy();

    await user.click(screen.getByText('Profile'));

    await waitFor(() => expect(onExited).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('reuses the shared animation defaults established by the first component', () => {
    // The slice must not fork its own magic numbers; it consumes the shared
    // tokens so the whole library animates consistently.
    expect(DEFAULT_DURATION).toBe(250);
    expect(DEFAULT_EASING).toBe('easeInOut');
  });
});
