import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AnimatedDialog } from './AnimatedDialog';

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

describe('AnimatedDialog', () => {
  it('renders its children in a dialog role when open', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open>
        <p>Dialog body</p>
      </AnimatedDialog>,
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Dialog body')).toBeTruthy();
  });

  it('marks the dialog aria-modal, per the WAI-ARIA Dialog (Modal) Pattern', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open>
        <p>Dialog body</p>
      </AnimatedDialog>,
    );

    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('lets a host override aria-modal through PaperProps', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open PaperProps={{ 'aria-modal': false }}>
        <p>Dialog body</p>
      </AnimatedDialog>,
    );

    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('false');
  });

  it('does not render dialog content when closed', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open={false}>
        <p>Dialog body</p>
      </AnimatedDialog>,
    );

    expect(screen.queryByText('Dialog body')).toBeNull();
  });

  it('forwards standard MUI Dialog props such as aria-labelledby', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open aria-labelledby="dialog-title">
        <h2 id="dialog-title">Title</h2>
      </AnimatedDialog>,
    );

    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).toBe('dialog-title');
  });

  it('accepts variant, duration and easing prop overrides without error', () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open variant="slide-up" duration={500} easing="linear">
        <p>Custom animation</p>
      </AnimatedDialog>,
    );

    expect(screen.getByText('Custom animation')).toBeTruthy();
  });

  it('renders content instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    render(
      <AnimatedDialog open>
        <p>Reduced motion body</p>
      </AnimatedDialog>,
    );

    // With reduced motion the dialog must still render its content; the shared
    // transition simply collapses its duration to zero (see shared/animation).
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Reduced motion body')).toBeTruthy();
  });

  it('drives the MUI transition lifecycle callbacks through Framer Motion', async () => {
    // Reduced motion collapses the duration to zero so the enter animation
    // completes synchronously, exercising the onEnter -> onEntered lifecycle
    // that bridges Framer Motion back to MUI's mount/unmount contract.
    mockReducedMotion(true);
    const onEnter = vi.fn();
    const onEntered = vi.fn();

    render(
      <AnimatedDialog open TransitionProps={{ onEnter, onEntered }}>
        <p>Lifecycle body</p>
      </AnimatedDialog>,
    );

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());
  });

  it('unmounts closed content after the exit lifecycle completes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();
    const { rerender } = render(
      <AnimatedDialog open TransitionProps={{ onExited }}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    expect(screen.getByText('Closing body')).toBeTruthy();

    rerender(
      <AnimatedDialog open={false} TransitionProps={{ onExited }}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    await waitFor(() => expect(onExited).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Closing body')).toBeNull());
  });
});
