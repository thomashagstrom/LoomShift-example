import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActions, OkCancelButtons } from './index';

afterEach(cleanup);

/**
 * `OkCancelButtons` is the published alias of {@link ConfirmActions}, so these
 * cover the pair's contract through the name a consumer imports rather than
 * re-testing the behaviour — that lives in `ConfirmActions.test.tsx`.
 */
describe('OkCancelButtons', () => {
  it('is the ConfirmActions component under its other name', () => {
    // Identity, not just equivalence: an alias that drifted into a second
    // implementation would give dialogs two different Ok/Cancel pairs.
    expect(OkCancelButtons).toBe(ConfirmActions);
  });

  it('renders an Ok and a Cancel button whose labels are configurable', () => {
    const { rerender } = render(<OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Ok',
      'Cancel',
    ]);

    rerender(
      <OkCancelButtons
        onOk={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Publish"
        cancelLabel="Keep editing"
      />,
    );
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Publish',
      'Keep editing',
    ]);
  });

  it('exposes onOk and onCancel as separate callbacks', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<OkCancelButtons onOk={onOk} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Ok' }));
    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['disableConfirm', { disableConfirm: true } as const, true, false],
    ['disableCancel', { disableCancel: true } as const, false, true],
  ])('disables Ok and Cancel independently via %s', (_prop, props, okDisabled, cancelDisabled) => {
    render(<OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} {...props} />);

    expect(screen.getByRole('button', { name: 'Ok' })).toHaveProperty('disabled', okDisabled);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty(
      'disabled',
      cancelDisabled,
    );
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('reaches both buttons with Tab and fires the focused one with %s', async (_name, key) => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<OkCancelButtons onOk={onOk} onCancel={onCancel} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ok' }));
    await user.keyboard(key);
    expect(onOk).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    await user.keyboard(key);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
