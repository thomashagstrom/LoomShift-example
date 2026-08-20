import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import Divider from '@mui/material/Divider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ConfirmActions } from '../confirm-actions/ConfirmActions';
import { AnimatedStack } from './AnimatedStack';
import type { AnimatedStackVariant } from './types';

afterEach(cleanup);

/** Resolves once Framer Motion has had a frame to advance its animations. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The stack's root element — the `<div>` MUI's `Stack` renders. */
const stackRoot = () => screen.getByTestId('stack');

describe('AnimatedStack', () => {
  it('renders arbitrary children as its own direct flex items, in order', () => {
    render(
      <AnimatedStack data-testid="stack">
        <span>first</span>
        <span>second</span>
        <span>third</span>
      </AnimatedStack>,
    );

    const children = Array.from(stackRoot().children);
    expect(children.map((child) => child.textContent)).toEqual(['first', 'second', 'third']);
  });

  it('forwards the MUI Stack layout props', () => {
    render(
      <AnimatedStack
        data-testid="stack"
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <span>only</span>
      </AnimatedStack>,
    );

    const style = getComputedStyle(stackRoot());
    expect(style.display).toBe('flex');
    expect(style.flexDirection).toBe('row');
    expect(style.alignItems).toBe('center');
    expect(style.justifyContent).toBe('space-between');
  });

  it('forwards sx', () => {
    render(
      <AnimatedStack data-testid="stack" sx={{ maxWidth: 320 }}>
        <span>only</span>
      </AnimatedStack>,
    );

    expect(getComputedStyle(stackRoot()).maxWidth).toBe('320px');
  });

  it('lets Stack place dividers between the children', () => {
    render(
      <AnimatedStack data-testid="stack" divider={<Divider flexItem />}>
        <span>first</span>
        <span>second</span>
      </AnimatedStack>,
    );

    // Two children with one divider woven between them: the divider is Stack's
    // own doing, so it only works while the children are direct flex items.
    expect(stackRoot().children).toHaveLength(3);
    expect(stackRoot().children[1].tagName).toBe('HR');
  });

  it('adds no width or overflow of its own', () => {
    render(
      <AnimatedStack data-testid="stack">
        <span>only</span>
      </AnimatedStack>,
    );

    // jsdom has no layout engine, so this guards the properties that would cause
    // clipping rather than measuring a rendered box: the stack constrains nothing
    // by itself, which is what lets it fit containers from 320px to 1440px.
    const style = getComputedStyle(stackRoot());
    expect(style.overflow).toBe('');
    expect(style.width).toBe('');
    expect(style.maxWidth).toBe('');
  });

  it('forwards its ref to the root element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <AnimatedStack ref={ref} data-testid="stack">
        <span>only</span>
      </AnimatedStack>,
    );

    expect(ref.current).toBe(stackRoot());
  });

  it('keeps a ConfirmActions child fully interactive', () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();
    render(
      <AnimatedStack data-testid="stack" spacing={2}>
        <span>Delete this project?</span>
        <ConfirmActions onOk={onOk} onCancel={onCancel} />
      </AnimatedStack>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Ok', 'Cancel']);

    buttons[0].click();
    expect(onOk).toHaveBeenCalledTimes(1);
    buttons[1].click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('animates itself in on mount and settles fully visible', async () => {
    render(
      <AnimatedStack data-testid="stack" duration={40}>
        <span>only</span>
      </AnimatedStack>,
    );

    const root = stackRoot();
    expect(root.style.opacity).toBe('0');

    await waitFor(() => expect(root.style.opacity).toBe('1'), { timeout: 500 });
  });

  it.each<[AnimatedStackVariant, RegExp]>([
    ['grow', /scale/],
    ['slide-up', /translateY/],
    ['slide-down', /translateY/],
  ])('starts %s from a transformed state', async (variant, transform) => {
    render(
      <AnimatedStack data-testid="stack" variant={variant} duration={400}>
        <span>only</span>
      </AnimatedStack>,
    );

    await waitFor(() => expect(stackRoot().style.transform).toMatch(transform), { timeout: 500 });
  });

  it('leaves the default fade without any transform', async () => {
    render(
      <AnimatedStack data-testid="stack" duration={400}>
        <span>only</span>
      </AnimatedStack>,
    );

    await nextFrame();
    await nextFrame();

    // The default has to be the preset that moves nothing, so dropping the stack
    // around an existing layout never shifts it.
    expect(stackRoot().style.transform).toBe('');
  });

  it('appears instantly with duration={0}', async () => {
    render(
      <AnimatedStack data-testid="stack" duration={0}>
        <span>only</span>
      </AnimatedStack>,
    );

    // One frame is all Framer Motion needs for a zero-length transition, so the
    // stack is there before the next paint rather than fading in.
    await nextFrame();
    expect(stackRoot().style.opacity).toBe('1');
  });

  describe('gradient background', () => {
    it('paints an animated gradient with no props beyond children', async () => {
      render(
        <AnimatedStack data-testid="stack">
          <span>only</span>
        </AnimatedStack>,
      );

      const root = stackRoot();
      const style = getComputedStyle(root);
      expect(style.backgroundImage).toMatch(/linear-gradient/);
      // Room for the sweep to move in — without the overscan the position
      // animates but nothing visibly changes.
      expect(style.backgroundSize).toBe('200% 200%');

      // Framer Motion drives the sweep inline, so the position leaves the
      // resting first frame on its own once the loop starts.
      await waitFor(() => expect(root.style.backgroundPosition).not.toBe(''), { timeout: 500 });
    });

    it('builds the gradient from the theme palette', () => {
      const theme = createTheme({
        palette: { primary: { main: '#102030' }, secondary: { main: '#405060' } },
      });
      render(
        <ThemeProvider theme={theme}>
          <AnimatedStack data-testid="stack">
            <span>only</span>
          </AnimatedStack>
        </ThemeProvider>,
      );

      const { backgroundImage } = getComputedStyle(stackRoot());
      expect(backgroundImage).toContain('16, 32, 48');
      expect(backgroundImage).toContain('64, 80, 96');
    });

    it("paints the theme's own surface under the tints", () => {
      // The tints are translucent, so the contrast guarantee only holds if they
      // composite over a surface the component owns rather than the page.
      const theme = createTheme({ palette: { background: { paper: '#fafbfc' } } });
      render(
        <ThemeProvider theme={theme}>
          <AnimatedStack data-testid="stack">
            <span>only</span>
          </AnimatedStack>
        </ThemeProvider>,
      );

      expect(getComputedStyle(stackRoot()).backgroundColor).toBe('rgb(250, 251, 252)');
    });

    it('paints nothing with background="none"', () => {
      render(
        <AnimatedStack data-testid="stack" background="none">
          <span>only</span>
        </AnimatedStack>,
      );

      // jsdom reports the CSS initial values rather than an empty string, so
      // this is "the component set nothing", not "the property is missing".
      const style = getComputedStyle(stackRoot());
      expect(style.backgroundImage).toBe('');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it('holds the gradient still with backgroundDuration={0}', async () => {
      render(
        <AnimatedStack data-testid="stack" backgroundDuration={0}>
          <span>only</span>
        </AnimatedStack>,
      );

      const root = stackRoot();
      await nextFrame();
      await nextFrame();

      // Still a panel, just not a moving one.
      expect(getComputedStyle(root).backgroundImage).toMatch(/linear-gradient/);
      expect(root.style.backgroundPosition).toBe('');
    });

    it('shifts no layout when the background is turned on or off', () => {
      const { rerender } = render(
        <AnimatedStack data-testid="stack" background="none" spacing={2} direction="row">
          <span>only</span>
        </AnimatedStack>,
      );
      const plain = getComputedStyle(stackRoot());
      const boxModel = [plain.display, plain.flexDirection, plain.padding, plain.margin];

      rerender(
        <AnimatedStack data-testid="stack" background="brand" spacing={2} direction="row">
          <span>only</span>
        </AnimatedStack>,
      );
      const painted = getComputedStyle(stackRoot());

      // The gradient is paint only: everything that could move a child is
      // identical with it on and off.
      expect([painted.display, painted.flexDirection, painted.padding, painted.margin]).toEqual(
        boxModel,
      );
    });

    it('lets a caller sx override the gradient', () => {
      render(
        <AnimatedStack data-testid="stack" sx={{ backgroundImage: 'none', maxWidth: 320 }}>
          <span>only</span>
        </AnimatedStack>,
      );

      const style = getComputedStyle(stackRoot());
      expect(style.backgroundImage).toBe('none');
      expect(style.maxWidth).toBe('320px');
    });
  });

  it('rejects unknown props at the type level', () => {
    render(
      <AnimatedStack
        data-testid="stack"
        // @ts-expect-error — the prop surface is exactly MUI Stack's plus the
        // animation trio, so anything else is a compile error. Removing this
        // directive has to fail `npm run typecheck`.
        stagger={0.5}
      >
        <span>only</span>
      </AnimatedStack>,
    );

    expect(stackRoot()).toBeTruthy();
  });
});
