import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react-vite';
import * as dialogStories from './AnimatedDialog.stories';
import * as snackbarStories from './snackbar/AnimatedSnackbar.stories';

/**
 * Smoke test for the docs site: the stories *are* the documentation, so a story
 * that throws would ship a broken page. `composeStories` renders each one with
 * its args and decorators applied, exactly as Storybook does.
 */

/** Framer Motion's `useReducedMotion` needs `matchMedia`, absent in jsdom. */
vi.stubGlobal(
  'matchMedia',
  (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList,
);

afterEach(cleanup);

describe('AnimatedDialog stories', () => {
  it.each(Object.entries(composeStories(dialogStories)))('renders %s', (_name, Story) => {
    render(<Story />);

    // The stories open by default so the canvas shows the component itself.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Publish changes?')).toBeTruthy();
  });
});

describe('AnimatedSnackbar stories', () => {
  it.each(Object.entries(composeStories(snackbarStories)))('renders %s', (_name, Story) => {
    render(<Story />);

    expect(screen.getByRole('button', { name: /show snackbar/i })).toBeTruthy();
  });
});
