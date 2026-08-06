import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmActions } from './ConfirmActions';

afterEach(cleanup);

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
