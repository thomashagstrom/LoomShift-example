import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { AnimatedDialog } from './AnimatedDialog';
import { DEFAULT_DURATION } from './shared/animation';

/**
 * The enter/exit animation itself, asserted with motion left on.
 *
 * It has to be its own file: Framer Motion reads `matchMedia` once per module
 * instance, so a suite that has already stated `reduce` cannot state
 * `no-preference` afterwards. `AnimatedDialog.test.tsx` holds the behaviour that
 * is faster to assert with the transition collapsed.
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
 * Waits out a stretch of real time, so a duration can be asserted against
 * {@link DEFAULT_DURATION} rather than passing by luck: a dialog that dropped
 * the prop and fell back to the default settles inside the window.
 *
 * Wrapped in `act` because MUI's own backdrop fade settles inside the window and
 * re-renders the modal as it does.
 */
const elapse = (ms: number) => act(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

/** How far the dialog has faded in — `0` fully out, `1` fully in. */
function opacityOf(element: HTMLElement): number {
  return element.style.opacity === '' ? 1 : Number(element.style.opacity);
}

/** The zoom variant's scale. `1` once Framer Motion settles the transform. */
function scaleOf(element: HTMLElement): number {
  const scale = /scale\(([\d.]+)\)/.exec(element.style.transform);
  return scale ? Number(scale[1]) : 1;
}

describe('AnimatedDialog open/close animation', () => {
  it('fades and scales the dialog in when it opens', async () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open duration={300}>
        <p>Opening body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    // The first frame is the default `zoom` variant's `closed` target: fully
    // transparent and slightly shrunk, so the dialog grows into place.
    expect(opacityOf(transition)).toBeLessThan(1);
    expect(scaleOf(transition)).toBeLessThan(1);

    await waitFor(() => expect(opacityOf(transition)).toBe(1), { timeout: 1000 });
    expect(scaleOf(transition)).toBe(1);
  });

  it('animates the dialog back out before MUI unmounts it', async () => {
    mockReducedMotion(false);
    const { rerender } = render(
      <AnimatedDialog open duration={600}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    await waitFor(() => expect(opacityOf(transition)).toBe(1), { timeout: 1000 });

    rerender(
      <AnimatedDialog open={false} duration={600}>
        <p>Closing body</p>
      </AnimatedDialog>,
    );

    // Fading out while still on the page: MUI keeps the dialog mounted until
    // Framer Motion reports the exit finished, which is what makes the close
    // animation visible at all rather than an instant disappearance.
    await waitFor(() => {
      expect(screen.queryByText('Closing body')).not.toBeNull();
      expect(opacityOf(transition)).toBeLessThan(1);
    });

    await waitFor(() => expect(screen.queryByText('Closing body')).toBeNull(), { timeout: 2000 });
  });

  it('fades without moving the dialog for the fade variant', async () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open variant="fade" duration={300}>
        <p>Fading body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    expect(opacityOf(transition)).toBeLessThan(1);
    // Opacity is the whole animation here — a fade that also scaled or slid
    // would be the zoom preset under another name.
    expect(scaleOf(transition)).toBe(1);
    expect(transition.style.transform).not.toMatch(/translate/);

    await waitFor(() => expect(opacityOf(transition)).toBe(1), { timeout: 1000 });
  });

  it('slides the dialog up from below for the slide-up variant', async () => {
    mockReducedMotion(false);
    render(
      <AnimatedDialog open variant="slide-up" duration={300}>
        <p>Sliding body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    expect(transition.style.transform).toMatch(/translateY\((\d|\.)+px\)/);

    await waitFor(() => expect(opacityOf(transition)).toBe(1), { timeout: 1000 });
    expect(transition.style.transform).not.toMatch(/translateY\([^0]/);
  });

  it('keeps a long animation in flight for as long as its duration asks', async () => {
    mockReducedMotion(false);
    const onEntered = vi.fn();
    render(
      <AnimatedDialog open duration={5000} TransitionProps={{ onEntered }}>
        <p>Slow body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    // Twice the default duration, and the five-second fade is still nowhere
    // near done: MUI has not been told the enter finished either.
    await elapse(DEFAULT_DURATION * 2);

    expect(opacityOf(transition)).toBeLessThan(0.5);
    expect(onEntered).not.toHaveBeenCalled();
  });

  it('settles at once when the duration is zero', async () => {
    mockReducedMotion(false);
    const onEntered = vi.fn();
    render(
      <AnimatedDialog open duration={0} TransitionProps={{ onEntered }}>
        <p>Instant body</p>
      </AnimatedDialog>,
    );

    const transition = transitionOf(screen.getByRole('dialog'));
    // Held to well inside the default duration — a frame or two is all a
    // zero-length animation needs, and anything slower is the default running.
    await waitFor(() => expect(onEntered).toHaveBeenCalled(), {
      timeout: DEFAULT_DURATION * 0.6,
      interval: 5,
    });
    expect(opacityOf(transition)).toBe(1);
  });

  it('drives the animation through the easing it is given', async () => {
    mockReducedMotion(false);
    // A custom easing curve is the one easing Framer Motion has to call back
    // into, which is what makes the prop observable end to end.
    const easing = vi.fn((progress: number) => progress);
    render(
      <AnimatedDialog open duration={300} easing={easing}>
        <p>Eased body</p>
      </AnimatedDialog>,
    );

    await waitFor(() => expect(easing).toHaveBeenCalled());
  });
});
