import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import Divider from '@mui/material/Divider';
import { ConfirmActions } from '../confirm-actions/ConfirmActions';
import { AnimatedStack } from './AnimatedStack';
import { GRADIENT_KEYFRAMES } from './gradient';
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

  it('paints an animating gradient with no props but children', async () => {
    render(
      <AnimatedStack data-testid="stack">
        <span>only</span>
      </AnimatedStack>,
    );

    const root = stackRoot();
    // The surface itself is theme colour, so it is there from the first paint.
    expect(getComputedStyle(root).backgroundImage).toContain('linear-gradient');

    // The pan is a Framer Motion animation like every other in the library, so
    // it lands on the element's own style once it starts — and keeps moving,
    // which is the difference between an animated gradient and a static one.
    await waitFor(() => expect(root.style.backgroundPosition).toMatch(/^[\d.]+% 50%$/));
    const firstFrame = root.style.backgroundPosition;
    await waitFor(() => expect(root.style.backgroundPosition).not.toBe(firstFrame));
  });

  it('leaves the surface transparent with background="none"', async () => {
    render(
      <AnimatedStack data-testid="stack" background="none">
        <span>only</span>
      </AnimatedStack>,
    );

    await nextFrame();
    await nextFrame();

    const root = stackRoot();
    expect(getComputedStyle(root).backgroundImage).toBe('');
    expect(root.style.backgroundPosition).toBe('');
  });

  it('lets a caller sx override the gradient', () => {
    render(
      <AnimatedStack data-testid="stack" sx={{ backgroundColor: 'rgb(1, 2, 3)' }}>
        <span>only</span>
      </AnimatedStack>,
    );

    // The surface is composed with the caller's `sx`, not merged over it: a
    // stack that has been given its own colour keeps it.
    expect(getComputedStyle(stackRoot()).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('rests the gradient on one frame with duration={0}', async () => {
    render(
      <AnimatedStack data-testid="stack" duration={0}>
        <span>only</span>
      </AnimatedStack>,
    );

    await nextFrame();
    await nextFrame();

    const root = stackRoot();
    // Turning the motion off keeps the surface — it is colour, not movement —
    // and leaves it on the frame the pan would have started from.
    expect(getComputedStyle(root).backgroundImage).toContain('linear-gradient');
    expect(getComputedStyle(root).backgroundPosition).toBe(GRADIENT_KEYFRAMES[0]);
    expect(root.style.backgroundPosition).toBe('');
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
