import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * The reduced-motion path lives in its own file on purpose: Framer Motion reads
 * `matchMedia` once, on the first `useReducedMotion` call of the module instance,
 * so the preference has to be in place before anything renders. Vitest gives each
 * test file its own module registry, which is the only way to assert both
 * preferences without leaking one into the other.
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AnimatedStack with prefers-reduced-motion', () => {
  it('renders the layout instantly, with the children and the arrangement intact', async () => {
    mockReducedMotion(true);
    // Imported after the preference is in place, so Framer Motion reads it.
    const { AnimatedStack } = await import('./AnimatedStack');

    render(
      <AnimatedStack data-testid="stack" variant="slide-up" direction="row" spacing={2}>
        <span>first</span>
        <span>second</span>
      </AnimatedStack>,
    );

    const root = screen.getByTestId('stack');
    await nextFrame();

    expect(root.style.opacity).toBe('1');
    // Not even an instant slide: a one-frame jump reads as a flicker rather than
    // as motion-free rendering. Framer Motion resolves the settled target to
    // `none`, so no offset is ever applied.
    expect(root.style.transform).not.toMatch(/translate/);
    expect(getComputedStyle(root).flexDirection).toBe('row');
    expect(Array.from(root.children).map((child) => child.textContent)).toEqual([
      'first',
      'second',
    ]);
  });
});
