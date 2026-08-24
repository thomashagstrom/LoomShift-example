import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DialogTitle from '@mui/material/DialogTitle';
import { AnimatedDialog } from './AnimatedDialog';

/**
 * The press animation the dialog's built-in footer inherits from
 * `ConfirmActions`, asserted with motion left on.
 *
 * It has to be its own file: Framer Motion reads `matchMedia` once per module
 * instance, so a suite that has already stated `reduce` cannot state
 * `no-preference` afterwards. `AnimatedDialog.confirmActions.test.tsx` holds the
 * behaviour that is faster to assert with the transitions collapsed.
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

/** Pointer-event init matching the mouse press the other suites use. */
const MOUSE_PRESS = { pointerType: 'mouse', button: 0, isPrimary: true };

/** How far the button has sunk into its press — `0` at rest. See the main suite. */
function pressDepth(element: HTMLElement): number {
  const scale = /scale\(([\d.]+)\)/.exec(element.style.transform);
  return scale ? 1 - Number(scale[1]) : 0;
}

describe('AnimatedDialog Ok/Cancel footer press animation', () => {
  it.each(['Ok', 'Cancel'])('plays the press animation on %s', async (name) => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open onConfirm={vi.fn()} onCancel={vi.fn()} onClose={vi.fn()}>
        <DialogTitle>Publish release?</DialogTitle>
      </AnimatedDialog>,
    );

    const button = screen.getByRole('button', { name });
    expect(pressDepth(button)).toBe(0);

    // The same 100ms budget the ConfirmActions suites hold the press to: it has
    // to be visibly under way within a frame or two of pointer-down.
    fireEvent.pointerDown(button, MOUSE_PRESS);
    await waitFor(() => expect(pressDepth(button)).toBeGreaterThan(0), {
      timeout: 100,
      interval: 5,
    });

    fireEvent.pointerUp(button, MOUSE_PRESS);
    await waitFor(() => expect(pressDepth(button)).toBe(0), { timeout: 300 });
  });

  it('runs the confirm without waiting for the press animation', async () => {
    mockReducedMotion(false);
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <AnimatedDialog open onConfirm={onConfirm} onClose={onClose}>
        <DialogTitle>Publish release?</DialogTitle>
      </AnimatedDialog>,
    );

    const ok = screen.getByRole('button', { name: 'Ok' });
    fireEvent.pointerDown(ok, MOUSE_PRESS);
    await waitFor(() => expect(pressDepth(ok)).toBeGreaterThan(0));

    // The click lands mid-press, and the confirm and close both run there and
    // then — the animation is never on the callback's path.
    fireEvent.click(ok);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'confirm');
  });
});
