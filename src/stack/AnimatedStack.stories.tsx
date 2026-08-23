import * as React from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ConfirmActions } from '../confirm-actions/ConfirmActions';
import { AnimatedStack } from './AnimatedStack';
import type { AnimatedStackBackground, AnimatedStackVariant } from './types';

/** Placeholder content, so the stories show the layout rather than a design. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="body2">{children}</Typography>
    </Paper>
  );
}

const CARDS = ['One', 'Two', 'Three'];

const meta = {
  title: 'Components/AnimatedStack',
  component: AnimatedStack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A MUI `Stack` that animates itself in as it mounts. It is a layout component',
          'first: every `Stack` prop is forwarded untouched and arbitrary children render',
          'as its direct flex items, so wrapping an existing layout changes **when** it',
          'appears, never **how** it is arranged. It ships as its own feature slice with a',
          'subpath export.',
          '',
          'It also paints its own surface out of the box: a gradient tinted from the theme',
          'palette, panned slowly and continuously. `background="none"` turns it off.',
          '',
          "```tsx\nimport { AnimatedStack } from 'loomshift-example/stack';\n```",
        ].join('\n'),
      },
    },
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['fade', 'grow', 'slide-up', 'slide-down'],
      table: { defaultValue: { summary: "'fade'" } },
    },
    background: {
      control: 'inline-radio',
      options: ['gradient', 'none'],
      table: { defaultValue: { summary: "'gradient'" } },
    },
    duration: {
      control: { type: 'number', min: 0, step: 50 },
      table: { defaultValue: { summary: '250' } },
    },
    easing: { table: { defaultValue: { summary: "'easeInOut'" } } },
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    spacing: { control: { type: 'number', min: 0, step: 0.5 } },
    gradientColors: { control: 'object', table: { defaultValue: { summary: 'theme colours' } } },
    gradientAngle: { control: 'text', table: { defaultValue: { summary: "'120deg'" } } },
    gradientDuration: {
      control: { type: 'number', min: 0, step: 500 },
      table: { defaultValue: { summary: '12000' } },
    },
  },
  args: {
    variant: 'fade',
    background: 'gradient',
    duration: 250,
    direction: 'column',
    spacing: 1,
  },
} satisfies Meta<typeof AnimatedStack>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every prop is editable from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <AnimatedStack {...args} sx={{ width: 360 }}>
      {CARDS.map((card) => (
        <Card key={card}>{card}</Card>
      ))}
    </AnimatedStack>
  ),
};

/** The presets, in the order they are offered to a reviewer. */
const VARIANTS: { variant: AnimatedStackVariant; note: string }[] = [
  { variant: 'fade', note: 'The default — nothing moves, so no layout is ever shifted.' },
  { variant: 'grow', note: 'Scales up from slightly smaller as it fades in.' },
  { variant: 'slide-up', note: 'Rises into place from below.' },
  { variant: 'slide-down', note: 'Drops into place from above.' },
];

export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The four enter presets, built on the same shared tokens as the rest of the',
          'library (`250ms`, `easeInOut`). Replay re-mounts all four together, since the',
          'animation plays once per mount, so they can be compared in one glance.',
        ].join('\n'),
      },
    },
  },
  render: function VariantsStory(args) {
    const [run, setRun] = React.useState(0);

    return (
      <Stack spacing={3} sx={{ width: 360 }}>
        <Button variant="outlined" onClick={() => setRun((count) => count + 1)}>
          Replay
        </Button>
        {VARIANTS.map(({ variant, note }) => (
          <Stack key={variant} spacing={0.5}>
            <Typography variant="subtitle2">variant=&quot;{variant}&quot;</Typography>
            <Typography variant="body2" color="text.secondary">
              {note}
            </Typography>
            <AnimatedStack {...args} key={`${variant}-${run}`} variant={variant}>
              {CARDS.map((card) => (
                <Card key={card}>{card}</Card>
              ))}
            </AnimatedStack>
          </Stack>
        ))}
      </Stack>
    );
  },
};

/** The surface presets, with the one-line reason to reach for each. */
const BACKGROUNDS: { background: AnimatedStackBackground; note: string }[] = [
  {
    background: 'gradient',
    note: 'The default: a slow ambient tint drawn from the theme palette.',
  },
  {
    background: 'none',
    note: 'The full opt-out — the transparent stack, with nothing painted behind.',
  },
];

export const Background: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The surface is on by default, so a panel looks finished with no props beyond',
          'its children. It is one Framer Motion animation panning a `linear-gradient`',
          'built from `primary` and `secondary`, tinted to 8% over `background.paper` —',
          'faint enough to leave every text style legible, and slow enough (12s per',
          'sweep) to read as ambient rather than as movement. The pan ends on the frame',
          'it started from, so the loop has no seam. Replay re-mounts both stacks so the',
          'enter animation and the start of the sweep can be compared in one glance.',
        ].join('\n'),
      },
    },
  },
  render: function BackgroundStory(args) {
    const [run, setRun] = React.useState(0);

    return (
      <Stack spacing={3} sx={{ width: 360 }}>
        <Button variant="outlined" onClick={() => setRun((count) => count + 1)}>
          Replay
        </Button>
        {BACKGROUNDS.map(({ background, note }) => (
          <Stack key={background} spacing={0.5}>
            <Typography variant="subtitle2">background=&quot;{background}&quot;</Typography>
            <Typography variant="body2" color="text.secondary">
              {note}
            </Typography>
            <AnimatedStack {...args} key={`${background}-${run}`} background={background}>
              {CARDS.map((card) => (
                <Card key={card}>{card}</Card>
              ))}
            </AnimatedStack>
          </Stack>
        ))}
      </Stack>
    );
  },
};

export const DirectionAndSpacing: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The same children as a `row` and as a `column`, with `spacing` and `divider`',
          'set — the animation rides on top of MUI\'s layout rather than replacing it.',
          'The children stay the stack\'s own direct flex items, which is what keeps',
          '`spacing`, `divider` and `alignItems` working exactly as they do on `Stack`.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <Stack spacing={3} sx={{ width: 360 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">direction=&quot;row&quot;</Typography>
        <AnimatedStack
          {...args}
          direction="row"
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
        >
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">direction=&quot;column&quot;</Typography>
        <AnimatedStack {...args} direction="column" spacing={2} divider={<Divider flexItem />}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
    </Stack>
  ),
};

export const WithConfirmActions: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'Arbitrary children, including the `ConfirmActions` pair, at a narrow width.',
          'The stack constrains nothing itself — no width, no `overflow` — so the same',
          'markup fits containers from 320px up to 1440px without clipping, and the',
          'buttons stay fully interactive while the stack animates.',
          '',
          'It doubles as the contrast check for the default gradient: secondary text, the',
          "field's outline and the destructive button all sit on the surface here, and",
          'have to stay legible at every frame of the sweep, in light and dark theme',
          'alike.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <AnimatedStack {...args} spacing={2} sx={{ width: 320 }}>
      <Typography variant="h6">Delete project?</Typography>
      <Typography variant="body2" color="text.secondary">
        This removes the project and everything in it for every member.
      </Typography>
      <TextField label="Type the project name" size="small" />
      <Divider />
      <ConfirmActions confirmLabel="Delete" destructive onOk={fn()} onCancel={fn()} />
    </AnimatedStack>
  ),
};

export const CustomGradient: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          '`gradientColors` overrides the theme\'s `primary`/`secondary` pair with brand',
          'colours, tinted and swept the same way the default gradient is. The Controls',
          'panel exposes it directly, so a reviewer can try their own pair against the',
          'default shown alongside it.',
        ].join('\n'),
      },
    },
  },
  args: { gradientColors: ['#4F46E5', '#EC4899'] },
  render: (args) => (
    <Stack spacing={3} sx={{ width: 360 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Default gradient</Typography>
        <AnimatedStack variant={args.variant} duration={args.duration} spacing={args.spacing}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">gradientColors=[&quot;#4F46E5&quot;, &quot;#EC4899&quot;]</Typography>
        <AnimatedStack {...args}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
    </Stack>
  ),
};

/** The gradient override's edge cases, one panel per case. */
export const GradientEdgeCases: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'A single colour has no second stop to sweep towards, so it reads as a flat',
          'tint rather than a moving gradient. An invalid or omitted colour falls back',
          'to the theme pair instead of a broken background. `background="none"` drops',
          'the surface entirely, so `gradientColors` has nothing left to paint.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <Stack spacing={3} sx={{ width: 360 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Single colour (flat tint, no sweep)</Typography>
        <AnimatedStack {...args} gradientColors={['#4F46E5']}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">Invalid colour (falls back to theme)</Typography>
        <AnimatedStack {...args} gradientColors={['not-a-color', '#EC4899']}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">background=&quot;none&quot; (prop has no effect)</Typography>
        <AnimatedStack {...args} background="none" gradientColors={['#4F46E5', '#EC4899']}>
          {CARDS.map((card) => (
            <Card key={card}>{card}</Card>
          ))}
        </AnimatedStack>
      </Stack>
    </Stack>
  ),
};

export const ReducedMotion: Story = {
  args: { variant: 'slide-up', duration: 0 },
  parameters: {
    docs: {
      description: {
        story: [
          'The motion-free path, shown here with `duration={0}` — the same thing anyone',
          'whose system sets `prefers-reduced-motion: reduce` gets without asking. The',
          'layout appears instantly, arranged exactly as it is with the animation on.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <AnimatedStack {...args} sx={{ width: 360 }}>
      {CARDS.map((card) => (
        <Card key={card}>{card}</Card>
      ))}
    </AnimatedStack>
  ),
};
