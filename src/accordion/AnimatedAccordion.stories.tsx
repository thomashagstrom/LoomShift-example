import * as React from 'react';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedAccordion } from './AnimatedAccordion';
import type { AnimatedAccordionVariant } from './types';

/** Placeholder panels — enough content that the height animation is visible. */
const PANELS = [
  {
    id: 'shipping',
    title: 'Shipping',
    body: 'Orders ship within two business days. Tracking is emailed once the label is created.',
  },
  {
    id: 'returns',
    title: 'Returns',
    body: 'Unused items can be returned within 30 days for a full refund, shipping excluded.',
  },
  {
    id: 'support',
    title: 'Support',
    body: 'The support team answers within one business day on weekdays, and within two on weekends.',
  },
] as const;

const meta = {
  title: 'Components/AnimatedAccordion',
  component: AnimatedAccordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A drop-in replacement for MUI’s `Accordion` that animates its expand/collapse',
          'with Framer Motion, built as an independent feature slice with its own subpath',
          'export. Every MUI `Accordion` prop is forwarded — including its "first child is',
          'the summary, the rest is the body" composition, so it accepts any number of',
          'children exactly like the component it wraps.',
          '',
          "```tsx\nimport { AnimatedAccordion } from 'loomshift-example/accordion';\n```",
        ].join('\n'),
      },
    },
  },
  argTypes: {
    animationVariant: {
      control: 'inline-radio',
      options: ['collapse', 'fade'],
      table: { defaultValue: { summary: "'collapse'" } },
    },
    duration: {
      control: { type: 'number', min: 0, step: 50 },
      table: { defaultValue: { summary: '250' } },
    },
    easing: {
      control: 'select',
      options: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'circOut', 'backOut', 'anticipate'],
      table: { defaultValue: { summary: "'easeInOut'" } },
    },
  },
  args: {
    animationVariant: 'collapse',
    duration: 250,
    easing: 'easeInOut',
    // Every story below renders its own `children` through `render`; this is
    // only here to satisfy MUI's `Accordion`, which requires `children`.
    children: (
      <>
        <AccordionSummary>Summary</AccordionSummary>
        <AccordionDetails>Details</AccordionDetails>
      </>
    ),
  },
} satisfies Meta<typeof AnimatedAccordion>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A vertical stack of `AnimatedAccordion` items, single-expand mode (the
 * common accordion behaviour): opening one closes whichever other item was
 * open, so both the animate-in and the animate-out play together. Starts with
 * the first item already expanded, mobile-first at a 320px-ish width.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = React.useState<string | false>(PANELS[0].id);

    return (
      <Stack sx={{ width: 340 }}>
        {PANELS.map(({ id, title, body }) => (
          <AnimatedAccordion
            {...args}
            key={id}
            expanded={expanded === id}
            onChange={(_event, isExpanded) => setExpanded(isExpanded ? id : false)}
          >
            <AccordionSummary
              expandIcon={<span aria-hidden="true">▾</span>}
              aria-controls={`${id}-content`}
              id={`${id}-header`}
            >
              <Typography>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {body}
              </Typography>
            </AccordionDetails>
          </AnimatedAccordion>
        ))}
      </Stack>
    );
  },
};

/** The two animation presets, side by side. */
const VARIANTS: { animationVariant: AnimatedAccordionVariant; note: string }[] = [
  {
    animationVariant: 'collapse',
    note: 'The default — height only, matching MUI’s own `Collapse`.',
  },
  {
    animationVariant: 'fade',
    note: 'The same height animation with an opacity fade layered on top.',
  },
];

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Both presets, expanded together so the height-only collapse and the fade+collapse combo can be compared in one glance.',
      },
    },
  },
  render: function Render(args) {
    return (
      <Stack spacing={3} sx={{ width: 340 }}>
        {VARIANTS.map(({ animationVariant, note }) => (
          <Stack key={animationVariant} spacing={0.5}>
            <Typography variant="subtitle2">
              animationVariant=&quot;{animationVariant}&quot;
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {note}
            </Typography>
            <AnimatedAccordion {...args} animationVariant={animationVariant} defaultExpanded>
              <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
                <Typography>{PANELS[0].title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {PANELS[0].body}
                </Typography>
              </AccordionDetails>
            </AnimatedAccordion>
          </Stack>
        ))}
      </Stack>
    );
  },
};

/** Multiple panels open at once — each item's `expanded` state is independent. */
export const MultiExpand: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Every item manages its own `expanded` state (MUI\'s uncontrolled `defaultExpanded`), so any number can be open together — the opposite of the single-expand `Playground` story.',
      },
    },
  },
  render: (args) => (
    <Stack sx={{ width: 340 }}>
      {PANELS.map(({ id, title, body }, index) => (
        <AnimatedAccordion {...args} key={id} defaultExpanded={index === 0 || index === 1}>
          <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
            <Typography>{title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {body}
            </Typography>
          </AccordionDetails>
        </AnimatedAccordion>
      ))}
    </Stack>
  ),
};

export const ReducedMotion: Story = {
  args: { duration: 0 },
  parameters: {
    docs: {
      description: {
        story:
          'The motion-free path, shown here with `duration={0}` — the same thing anyone whose system sets `prefers-reduced-motion: reduce` gets without asking. The panel still expands and collapses, just without an animated height change in between.',
      },
    },
  },
  render: function Render(args) {
    const [expanded, setExpanded] = React.useState<string | false>(PANELS[0].id);

    return (
      <Stack sx={{ width: 340 }}>
        {PANELS.map(({ id, title, body }) => (
          <AnimatedAccordion
            {...args}
            key={id}
            expanded={expanded === id}
            onChange={(_event, isExpanded) => setExpanded(isExpanded ? id : false)}
          >
            <AccordionSummary expandIcon={<span aria-hidden="true">▾</span>}>
              <Typography>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {body}
              </Typography>
            </AccordionDetails>
          </AnimatedAccordion>
        ))}
      </Stack>
    );
  },
};
