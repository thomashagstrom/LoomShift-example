import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { AnimatedAccordion } from './AnimatedAccordion';
import { DEFAULT_DURATION, DEFAULT_EASING } from '../shared/animation';

/**
 * Mock `prefers-reduced-motion`. jsdom does not implement `matchMedia`, which
 * Framer Motion's `useReducedMotion` relies on, so tests must provide it.
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

describe('AnimatedAccordion', () => {
  it('renders its summary and, expanded, its details', () => {
    render(
      <AnimatedAccordion expanded>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    expect(screen.getByText('Question')).toBeTruthy();
    expect(screen.getByText('Answer')).toBeTruthy();
  });

  it('exposes aria-expanded on the summary button, toggled by clicks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AnimatedAccordion expanded={false} onChange={onChange}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    const summary = screen.getByText('Question').closest('[role="button"]') as HTMLElement;
    expect(summary.getAttribute('aria-expanded')).toBe('false');

    await user.click(summary);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), true);
  });

  it('accepts variant, duration and easing prop overrides without error', () => {
    mockReducedMotion(false);
    render(
      <AnimatedAccordion expanded animationVariant="fade" duration={500} easing="linear">
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Custom</AccordionDetails>
      </AnimatedAccordion>,
    );
    expect(screen.getByText('Custom')).toBeTruthy();
  });

  it('renders instantly when the user prefers reduced motion', () => {
    mockReducedMotion(true);
    render(
      <AnimatedAccordion expanded>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Reduced</AccordionDetails>
      </AnimatedAccordion>,
    );
    expect(screen.getByText('Reduced')).toBeTruthy();
  });

  it('keeps collapsed details mounted but hides them from focus and screen readers', () => {
    mockReducedMotion(true);
    render(
      <AnimatedAccordion expanded={false}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    // Still in the DOM — MUI's own Accordion never unmounts the body — but
    // hidden via the same `visibility` technique MUI's `Collapse` uses, so a
    // closed panel cannot be tabbed into or announced.
    const answer = screen.getByText('Answer');
    expect(answer).toBeTruthy();
    const collapseRoot = answer.closest('[role="region"]')?.parentElement
      ?.parentElement as HTMLElement;
    expect(collapseRoot.style.visibility).toBe('hidden');
  });

  it('reveals the panel once expanded and drives the transition lifecycle', async () => {
    mockReducedMotion(true);
    const onEnter = vi.fn();
    const onEntered = vi.fn();

    const { rerender } = render(
      <AnimatedAccordion expanded={false} TransitionProps={{ onEnter, onEntered }}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    rerender(
      <AnimatedAccordion expanded TransitionProps={{ onEnter, onEntered }}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    await waitFor(() => expect(onEntered).toHaveBeenCalled());

    const answer = screen.getByText('Answer');
    const collapseRoot = answer.closest('[role="region"]')?.parentElement
      ?.parentElement as HTMLElement;
    expect(collapseRoot.style.visibility).toBe('visible');
  });

  it('hides the panel again once the collapse lifecycle finishes', async () => {
    mockReducedMotion(true);
    const onExited = vi.fn();

    const { rerender } = render(
      <AnimatedAccordion expanded TransitionProps={{ onExited }}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    rerender(
      <AnimatedAccordion expanded={false} TransitionProps={{ onExited }}>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>Answer</AccordionDetails>
      </AnimatedAccordion>,
    );

    await waitFor(() => expect(onExited).toHaveBeenCalled());

    const answer = screen.getByText('Answer');
    const collapseRoot = answer.closest('[role="region"]')?.parentElement
      ?.parentElement as HTMLElement;
    expect(collapseRoot.style.visibility).toBe('hidden');
  });

  it('accepts any number of children, like MUI’s own Accordion', () => {
    render(
      <AnimatedAccordion expanded>
        <AccordionSummary>Question</AccordionSummary>
        <AccordionDetails>First</AccordionDetails>
        <div>Second</div>
        <div>Third</div>
      </AnimatedAccordion>,
    );

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getByText('Third')).toBeTruthy();
  });

  it('reuses the shared animation defaults established by the first component', () => {
    // The slice must not fork its own magic numbers; it consumes the shared
    // tokens so the whole library animates consistently.
    expect(DEFAULT_DURATION).toBe(250);
    expect(DEFAULT_EASING).toBe('easeInOut');
  });
});
