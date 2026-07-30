import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AnimatedSnackbar } from './AnimatedSnackbar';
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedSnackbar', () => {
  it('renders its message when open', () => {
    render(<AnimatedSnackbar open message="Saved" />);
    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('accepts variant, duration and easing prop overrides without error', () => {
    mockReducedMotion(false);
    render(
      <AnimatedSnackbar open message="Custom" variant="grow" duration={500} easing="linear" />,
    );
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders its message instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    render(<AnimatedSnackbar open message="Reduced" />);
    expect(screen.getByText('Reduced')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<AnimatedSnackbar open={false} message="Saved" />);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('forwards arbitrary Snackbar children', () => {
    render(
      <AnimatedSnackbar open>
        <div role="status">Custom content</div>
      </AnimatedSnackbar>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('drives the MUI transition lifecycle callbacks through Framer Motion', async () => {
    // Reduced motion collapses the duration to zero so the enter animation
    // completes synchronously, exercising the onEnter -> onEntered lifecycle
    // that bridges Framer Motion back to MUI's mount/unmount contract.
    mockReducedMotion(true);
    const onEnter = vi.fn();
    const onEntered = vi.fn();

    render(
      <AnimatedSnackbar open message="Lifecycle" TransitionProps={{ onEnter, onEntered }} />,
    );

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());
  });

  it('unmounts closed content after the exit lifecycle completes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();
    const { rerender } = render(
      <AnimatedSnackbar open message="Closing" TransitionProps={{ onExited }} />,
    );

    expect(screen.getByText('Closing')).toBeTruthy();

    rerender(
      <AnimatedSnackbar open={false} message="Closing" TransitionProps={{ onExited }} />,
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
