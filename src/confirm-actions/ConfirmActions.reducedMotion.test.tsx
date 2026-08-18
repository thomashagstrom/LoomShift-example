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

/** Pointer-event init matching the mouse press the other suites use. */
const MOUSE_PRESS = { pointerType: 'mouse', button: 0, isPrimary: true };

describe('ConfirmActions with prefers-reduced-motion', () => {
  it('does not move the buttons on press but still confirms', async () => {
    mockReducedMotion(true);
    const onOk = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    fireEvent.pointerDown(ok, MOUSE_PRESS);
    await nextFrame();
    await nextFrame();

    // No transform at all — not even an instant one, which would read as a
    // flicker rather than as motion-free feedback.
    expect(ok.style.transform).toBe('');

    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it.each(['Ok', 'Cancel'])('shades %s instantly while it is held down', async (name) => {
    mockReducedMotion(true);
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} />);

    const button = screen.getByRole('button', { name });
    expect(button.style.filter).toBe('');

    fireEvent.pointerDown(button, MOUSE_PRESS);
    // One frame is all Framer Motion needs for a zero-length transition, so the
    // shade is there before the next paint rather than fading in.
    await nextFrame();
    expect(button.style.filter).toBe('brightness(0.9)');

    fireEvent.pointerUp(button, MOUSE_PRESS);
    await nextFrame();
    expect(button.style.filter).toBe('brightness(1)');
  });

  it('shades a keyboard press and releases it on key-up', async () => {
    mockReducedMotion(true);
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    fireEvent.keyDown(ok, { key: 'Enter' });
    await nextFrame();
    expect(ok.style.filter).toBe('brightness(0.9)');

    fireEvent.keyUp(ok, { key: 'Enter' });
    await nextFrame();
    expect(ok.style.filter).toBe('brightness(1)');
  });

  it('keeps the labels and both callbacks unchanged', async () => {
    mockReducedMotion(true);
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

  it('leaves the buttons untouched with pressVariant="none"', async () => {
    mockReducedMotion(true);
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} pressVariant="none" />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    fireEvent.pointerDown(ok, MOUSE_PRESS);
    await nextFrame();
    await nextFrame();

    // An explicit opt-out still wins: no movement and no shade, so MUI's own
    // ripple is the only feedback.
    expect(ok.style.transform).toBe('');
    expect(ok.style.filter).toBe('');
  });
});
