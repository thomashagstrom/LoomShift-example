import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ConfirmActions } from './ConfirmActions';

/**
 * The reduced-motion press lives in its own file on purpose: Framer Motion
 * reads `matchMedia` once, on the first `useReducedMotion` call of the module
 * instance, so the preference has to be in place before anything renders. Vitest
 * gives each test file its own module registry, which is the only way to assert
 * both preferences without leaking one into the other.
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

describe('ConfirmActions with prefers-reduced-motion', () => {
  it('does not move the buttons on press but still confirms', async () => {
    mockReducedMotion(true);
    const onOk = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    fireEvent.pointerDown(ok, { pointerType: 'mouse', button: 0, isPrimary: true });
    await nextFrame();
    await nextFrame();

    // No transform at all — not even an instant one, which would read as a
    // flicker rather than as motion-free feedback.
    expect(ok.style.transform).toBe('');

    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(1);
  });
});
