import * as React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuItem from '@mui/material/MenuItem';
import { AnimatedMenu } from './AnimatedMenu';
import type { AnimatedMenuProps } from './types';
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

interface HarnessProps extends Omit<AnimatedMenuProps, 'anchorEl'> {
  children: React.ReactNode;
}

/**
 * Renders a real trigger element and hands its DOM node to `AnimatedMenu` as
 * `anchorEl` — the same "pop up from any element" contract MUI's `Menu`
 * itself requires.
 */
function MenuHarness({ children, ...menuProps }: HarnessProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <button ref={setAnchorEl}>Open</button>
      <AnimatedMenu anchorEl={anchorEl} {...menuProps}>
        {children}
      </AnimatedMenu>
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedMenu', () => {
  it('renders its items when open', () => {
    render(
      <MenuHarness open>
        <MenuItem>Profile</MenuItem>
      </MenuHarness>,
    );
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('exposes the menu role, so it pops up as an accessible menu from any anchor', () => {
    render(
      <MenuHarness open>
        <MenuItem>Profile</MenuItem>
      </MenuHarness>,
    );
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('accepts variant, duration and easing prop overrides without error', () => {
    mockReducedMotion(false);
    render(
      <MenuHarness open animationVariant="fade" duration={500} easing="linear">
        <MenuItem>Custom</MenuItem>
      </MenuHarness>,
    );
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders its items instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    render(
      <MenuHarness open>
        <MenuItem>Reduced</MenuItem>
      </MenuHarness>,
    );
    expect(screen.getByText('Reduced')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(
      <MenuHarness open={false}>
        <MenuItem>Profile</MenuItem>
      </MenuHarness>,
    );
    expect(screen.queryByText('Profile')).toBeNull();
  });

  it('fires onClose when an item is selected', async () => {
    const onClose = vi.fn();
    render(
      <MenuHarness open onClose={onClose}>
        <MenuItem onClick={onClose}>Profile</MenuItem>
      </MenuHarness>,
    );

    await userEvent.click(screen.getByText('Profile'));
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
      <MenuHarness open TransitionProps={{ onEnter, onEntered }}>
        <MenuItem>Lifecycle</MenuItem>
      </MenuHarness>,
    );

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());
  });

  it('unmounts closed content after the exit lifecycle completes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();
    const { rerender } = render(
      <MenuHarness open TransitionProps={{ onExited }}>
        <MenuItem>Closing</MenuItem>
      </MenuHarness>,
    );

    expect(screen.getByText('Closing')).toBeTruthy();

    rerender(
      <MenuHarness open={false} TransitionProps={{ onExited }}>
        <MenuItem>Closing</MenuItem>
      </MenuHarness>,
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
