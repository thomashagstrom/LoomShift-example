import { afterEach, describe, it, expect, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActions } from './ConfirmActions';

afterEach(cleanup);

type RejectionListener = (reason: unknown, promise: Promise<unknown>) => void;

/** Just the slice of `process` used below — the repo has no `@types/node`. */
interface RejectionEmitter {
  listeners(event: 'unhandledRejection'): RejectionListener[];
  removeAllListeners(event: 'unhandledRejection'): void;
  on(event: 'unhandledRejection', listener: RejectionListener): void;
  off(event: 'unhandledRejection', listener: RejectionListener): void;
}

const nodeProcess = (globalThis as unknown as { process: RejectionEmitter }).process;

/**
 * Takes over the runner's unhandled-rejection reporting for the length of one
 * test, so a deliberately rejected `onOk` can be asserted on instead of failing
 * the run. `restore()` gives the listeners back and returns what was caught.
 */
function withUnhandledRejectionsCaught() {
  const caught: unknown[] = [];
  const existing = nodeProcess.listeners('unhandledRejection');
  const capture: RejectionListener = (reason) => {
    caught.push(reason);
  };

  nodeProcess.removeAllListeners('unhandledRejection');
  nodeProcess.on('unhandledRejection', capture);

  return {
    restore() {
      nodeProcess.off('unhandledRejection', capture);
      existing.forEach((listener) => nodeProcess.on('unhandledRejection', listener));
      return caught;
    },
  };
}

/** Lets node reach the end of the turn, where it reports unhandled rejections. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ConfirmActions', () => {
  it('renders Ok before Cancel with default labels', () => {
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Ok', 'Cancel']);
  });

  it('overrides both labels via props', () => {
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} confirmLabel="Save" cancelLabel="Discard" />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeTruthy();
  });

  it('fires onOk exactly once per click and leaves onCancel untouched', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Ok' }));

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('fires onCancel exactly once per click and leaves onOk untouched', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).not.toHaveBeenCalled();
  });

  it('focuses the buttons in visual order when tabbing', async () => {
    const user = userEvent.setup();
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ok' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it.each([
    ['{Enter}', 'Enter'],
    [' ', 'Space'],
  ])('activates the focused button with %s', async (key) => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    await user.tab();
    await user.keyboard(key);

    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('blocks the confirm button while pending but keeps cancel interactive', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmActions onOk={onOk} onCancel={onCancel} pending />);

    // `userEvent` refuses to click a disabled MUI button (`pointer-events: none`),
    // so the disabled state itself is the assertion that Ok cannot fire again.
    const ok = screen.getByRole('button', { name: 'Ok' });
    expect(ok.getAttribute('aria-busy')).toBe('true');
    expect(ok).toHaveProperty('disabled', true);
    expect(onOk).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('goes busy while an onOk promise is in flight and recovers when it resolves', async () => {
    const user = userEvent.setup();
    let resolveOk = () => {};
    const onOk = vi.fn(() => new Promise<void>((resolve) => { resolveOk = resolve; }));
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    expect(ok.getAttribute('aria-busy')).toBe(null);

    await user.click(ok);
    expect(ok.getAttribute('aria-busy')).toBe('true');
    expect(ok).toHaveProperty('disabled', true);
    expect(screen.getByRole('progressbar')).toBeTruthy();

    await act(async () => {
      resolveOk();
    });

    expect(ok.getAttribute('aria-busy')).toBe(null);
    expect(ok).toHaveProperty('disabled', false);
    expect(screen.queryByRole('progressbar')).toBe(null);
  });

  it('does not fire onOk again while an onOk promise is in flight', async () => {
    const user = userEvent.setup();
    let resolveOk = () => {};
    const onOk = vi.fn(() => new Promise<void>((resolve) => { resolveOk = resolve; }));
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    await user.click(ok);
    // The button is disabled, so drive the handler directly: even a click that
    // gets past `disabled` must not start a second confirm.
    fireEvent.click(ok);
    ok.click();

    expect(onOk).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveOk();
    });

    // Settled, so the next click is a fresh confirm.
    await user.click(ok);
    expect(onOk).toHaveBeenCalledTimes(2);
  });

  it('keeps cancel interactive while an onOk promise is in flight', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmActions onOk={() => new Promise<void>(() => {})} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Ok' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('releases the busy state when the onOk promise rejects', async () => {
    const user = userEvent.setup();
    let rejectOk = (_reason?: unknown) => {};
    const onOk = vi.fn(() => new Promise<void>((_resolve, reject) => { rejectOk = reject; }));
    render(<ConfirmActions onOk={onOk} onCancel={vi.fn()} />);

    const ok = screen.getByRole('button', { name: 'Ok' });
    await user.click(ok);
    expect(ok).toHaveProperty('disabled', true);

    // The rejection is rethrown so a failed confirm is never silent; catch it
    // here so the deliberate failure does not surface as an unhandled one.
    const unhandled = withUnhandledRejectionsCaught();
    await act(async () => {
      rejectOk(new Error('save failed'));
    });
    await flush();
    expect(unhandled.restore().map(String)).toEqual(['Error: save failed']);

    // Back to idle, so the user can retry after seeing the host's error.
    expect(ok).toHaveProperty('disabled', false);
    expect(ok.getAttribute('aria-busy')).toBe(null);
  });

  it('tracks the onOk promise even when the host passes pending={false}', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmActions onOk={() => new Promise<void>(() => {})} onCancel={vi.fn()} pending={false} />,
    );

    // `pending` and the promise are additive: a host that hands us a literal
    // `false` (a Storybook control, say) must not switch the tracking off.
    const ok = screen.getByRole('button', { name: 'Ok' });
    await user.click(ok);

    expect(ok.getAttribute('aria-busy')).toBe('true');
    expect(ok).toHaveProperty('disabled', true);
  });

  it('disables only the confirm button via disableConfirm', () => {
    render(<ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} disableConfirm />);

    expect(screen.getByRole('button', { name: 'Ok' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', false);
  });

  it('forwards extra button props such as type="submit"', () => {
    render(
      <ConfirmActions onOk={vi.fn()} onCancel={vi.fn()} okButtonProps={{ type: 'submit' }} />,
    );

    expect(screen.getByRole('button', { name: 'Ok' }).getAttribute('type')).toBe('submit');
  });
});
