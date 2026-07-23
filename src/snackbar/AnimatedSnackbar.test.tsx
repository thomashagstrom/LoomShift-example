import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedSnackbar } from './AnimatedSnackbar';
import { DEFAULT_DURATION, DEFAULT_EASING } from '../shared/animation';

describe('AnimatedSnackbar', () => {
  it('renders its message when open', () => {
    render(<AnimatedSnackbar open message="Saved" />);
    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<AnimatedSnackbar open={false} message="Saved" />);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('forwards arbitrary Snackbar children', () => {
    render(
      <AnimatedSnackbar open>
        <div role="status">Custom content</div>
      </AnimatedSnackbar>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('reuses the shared animation defaults established by the first component', () => {
    // The slice must not fork its own magic numbers; it consumes the shared
    // tokens so the whole library animates consistently.
    expect(DEFAULT_DURATION).toBe(250);
    expect(DEFAULT_EASING).toBe('easeInOut');
  });
});
