import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OkCancelButtons } from './index';

afterEach(cleanup);

/**
 * The pair itself is `ConfirmActions`, covered in depth by its own suite. What
 * is checked here is the contract this subpath publishes: the component reaches
 * hosts under this name, with both callbacks, both labels, independent
 * disabling and keyboard operation intact.
 */
describe('OkCancelButtons', () => {
  it('renders Ok before Cancel with default labels', () => {
    render(<OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Ok', 'Cancel']);
  });

  it('overrides both labels via props', () => {
    render(
      <OkCancelButtons
        onOk={vi.fn()}
        onCancel={vi.fn()}
        confirmLabel="Save"
        cancelLabel="Discard"
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDefined();
  });

  it('fires onOk and onCancel from their own button only', async () => {
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

  it('disables Ok and Cancel independently', () => {
    const { rerender } = render(
      <OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} disableConfirm />,
    );

    expect(screen.getByRole('button', { name: 'Ok' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', false);

    rerender(<OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} disableCancel />);

    expect(screen.getByRole('button', { name: 'Ok' })).toHaveProperty('disabled', false);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', true);
  });

  it('reaches both buttons by Tab, in the order they are shown', async () => {
    const user = userEvent.setup();
    render(<OkCancelButtons onOk={vi.fn()} onCancel={vi.fn()} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ok' }));

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('activates the focused button with Enter and Space', async () => {
    const user = userEvent.setup();
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(<OkCancelButtons onOk={onOk} onCancel={onCancel} />);

    await user.tab();
    await user.keyboard('{Enter}');
    expect(onOk).toHaveBeenCalledTimes(1);

    await user.tab();
    await user.keyboard(' ');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOk).toHaveBeenCalledTimes(1);
  });
});
