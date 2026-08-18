import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConfirmActions } from './ConfirmActions';

/**
 * The other half of the reduced-motion pair: this file states the preference as
 * `no-preference` rather than leaving it to jsdom's default, so both settings are
 * asserted explicitly. It has to be its own file — Framer Motion reads
 * `matchMedia` once per module instance, so the two preferences cannot live in
 * one registry. See `ConfirmActions.reducedMotion.test.tsx` for `reduce`.
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

describe('ConfirmActions without a reduced-motion preference', () => {
  it.each(['Ok', 'Cancel'])('moves %s on press instead of shading it', async (name) => {
    mockReducedMotion(false);
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} />);

    const button = screen.getByRole('button', { name });
    fireEvent.pointerDown(button, MOUSE_PRESS);

    await waitFor(() => expect(pressDepth(button)).toBeGreaterThan(0), {
      timeout: 100,
      interval: 5,
    });
    // The shade is the motion-free stand-in, so it stays out of the way when the
    // button is free to move.
    expect(button.style.filter).toBe('');

    fireEvent.pointerUp(button, MOUSE_PRESS);
    await waitFor(() => expect(pressDepth(button)).toBe(0), { timeout: 300 });
  });

  it('keeps the labels and both callbacks unchanged', async () => {
    mockReducedMotion(false);
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmActions onOk={onOk} onCancel={onCancel} confirmLabel="Save" cancelLabel="Discard" />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Save', 'Discard']);

    fireEvent.click(buttons[0]);
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(buttons[1]);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).toHaveBeenCalledTimes(1);
  });
});
