import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

/**
 * The reduced-motion path lives in its own file on purpose: Framer Motion reads
 * `matchMedia` once, on the first `useReducedMotion` call of the module instance,
 * so the preference has to be in place before anything renders. Vitest gives each
 * test file its own module registry, which is the only way to assert both
 * preferences without leaking one into the other — see
 * `AnimatedDialog.fullMotion.test.tsx` for `no-preference`.
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

/** Resolves once Framer Motion has had a frame to advance its animations. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * The `motion.div` the dialog animates on. The paper sits inside
 * `MuiDialog-container`, which is the transition's only child, so the animated
 * element is two levels up from the `dialog` role.
 */
function transitionOf(dialog: HTMLElement): HTMLElement {
  const node = dialog.parentElement?.parentElement;
  if (!node) {
    throw new Error('Dialog is not mounted inside its transition');
  }
  return node;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedDialog with prefers-reduced-motion', () => {
  it('opens fully in place instead of fading or zooming in', async () => {
    mockReducedMotion(true);
    // Imported after the preference is in place, so Framer Motion reads it.
    const { AnimatedDialog } = await import('./AnimatedDialog');

    render(
      <AnimatedDialog open>
        <p>Reduced motion body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    await nextFrame();

    // Arrives settled rather than easing there: a one-frame fade or zoom reads
    // as a flicker rather than as a motion-free transition. The default `zoom`
    // variant is the one to check — it animates both properties.
    expect(transition.style.opacity).toBe('1');
    expect(transition.style.transform).not.toMatch(/scale\(0/);
    expect(screen.getByText('Reduced motion body')).toBeTruthy();
  });

  it('ignores a long duration rather than making the user wait it out', async () => {
    mockReducedMotion(true);
    const { AnimatedDialog } = await import('./AnimatedDialog');

    const onEntered = vi.fn();
    render(
      // The preference outranks the prop: a five-second dialog still opens now.
      <AnimatedDialog open duration={5000} TransitionProps={{ onEntered }}>
        <p>Slow body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    await waitFor(() => expect(onEntered).toHaveBeenCalled(), { timeout: 200, interval: 5 });

    // The enter reports done before the settled style is committed, so give it
    // the frame it needs rather than reading the initial `closed` target back.
    await nextFrame();
    expect(transition.style.opacity).toBe('1');
  });

  it('closes without an exit animation, unmounting the content', async () => {
    mockReducedMotion(true);
    const { AnimatedDialog } = await import('./AnimatedDialog');

    const { rerender } = render(
      <AnimatedDialog open duration={5000}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    expect(screen.getByText('Closing body')).toBeTruthy();
    // Fully open before closing it, so the exit has the whole distance to cover
    // rather than finishing early from a dialog that had barely faded in.
    await waitFor(() => expect(transition.style.opacity).toBe('1'), { timeout: 200, interval: 5 });

    rerender(
      <AnimatedDialog open={false} duration={5000}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    // MUI unmounts on `onExited`, so the content leaving the page inside a
    // couple of frames is the exit collapsing: a dialog that still faded out
    // over its five seconds would keep it there for all of them.
    await waitFor(() => expect(screen.queryByText('Closing body')).toBeNull(), {
      timeout: 150,
      interval: 5,
    });
  });
});
