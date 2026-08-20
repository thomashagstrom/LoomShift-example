import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
          'It also paints a looping gradient background by default (`background="subtle"`),',
          'built from the theme palette, so a stack with nothing but children already reads',
          'as a finished panel. Pass `background="none"` to turn it off.',
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
    duration: {
      control: { type: 'number', min: 0, step: 50 },
      table: { defaultValue: { summary: '250' } },
    },
    easing: { table: { defaultValue: { summary: "'easeInOut'" } } },
    background: {
      control: 'inline-radio',
      options: ['subtle', 'brand', 'none'],
      table: { defaultValue: { summary: "'subtle'" } },
    },
    backgroundDuration: {
      control: { type: 'number', min: 0, step: 500 },
      table: { defaultValue: { summary: '8000' } },
    },
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    spacing: { control: { type: 'number', min: 0, step: 0.5 } },
  },
  args: {
    variant: 'fade',
    duration: 250,
    background: 'subtle',
    backgroundDuration: 8000,
    direction: 'column',
    spacing: 1,
  },
} satisfies Meta<typeof AnimatedStack>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Padding is the story's own, not the component's: the gradient is paint only,
 * so a stack never adds space of its own to whatever it wraps.
 */
const PANEL_SX = { width: 360, p: 2 } as const;

/** Every prop is editable from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <AnimatedStack {...args} sx={PANEL_SX}>
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

/** The background presets, in the order they are offered to a reviewer. */
const BACKGROUNDS: { background: AnimatedStackBackground; note: string }[] = [
  {
    background: 'subtle',
    note: 'The default — a hint of the brand, close enough to the theme surface to sit under anything.',
  },
  {
    background: 'brand',
    note: 'The same gradient with the tint pushed further, for a hero or an empty state.',
  },
  { background: 'none', note: 'No paint at all: a plain, transparent stack.' },
];

export const Backgrounds: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The three background presets. Both gradients are built from the theme',
          "palette — `primary.main` and `secondary.main` as low-alpha tints over",
          '`background.paper` — so they follow a custom theme rather than hard-coding a',
          'colour. The sweep runs for as long as the stack is mounted and returns to the',
          'frame it started on, so the loop has no seam. Replay re-mounts all three, since',
          'the enter animation plays once per mount.',
        ].join('\n'),
      },
    },
  },
  render: function BackgroundsStory(args) {
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
            <AnimatedStack
              {...args}
              key={`${background}-${run}`}
              background={background}
              sx={{ p: 2 }}
            >
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

/** The three surfaces a panel realistically lands on, in one theme. */
function SurfaceSampler({
  mode,
  args,
}: {
  mode: 'light' | 'dark';
  args: Partial<React.ComponentProps<typeof AnimatedStack>>;
}) {
  const panel = (
    <AnimatedStack {...args} spacing={2} sx={{ width: 320, p: 2 }}>
      <Typography variant="h6">Delete project?</Typography>
      <Typography variant="body2" color="text.secondary">
        This removes the project and everything in it for every member.
      </Typography>
      <TextField label="Type the project name" size="small" />
      <Divider />
      <ConfirmActions confirmLabel="Delete" destructive onOk={fn()} onCancel={fn()} />
    </AnimatedStack>
  );

  return (
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <Stack spacing={2} sx={{ bgcolor: 'background.default', p: 2 }}>
        <Typography variant="subtitle2">{mode}</Typography>
        {panel}
        <Box sx={{ bgcolor: 'background.paper', p: 2 }}>{panel}</Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {panel}
        </Paper>
      </Stack>
    </ThemeProvider>
  );
}

export const OnThemeSurfaces: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The contrast evidence for the default preset: real content — an `h6`, secondary',
          'body text, a `TextField` and the `ConfirmActions` pair — over the gradient on',
          '`background.default`, on `background.paper` and inside an outlined `Paper`, in',
          'both palette modes.',
          '',
          'The stack paints its own opaque `background.paper` underneath the tints, so what',
          'the text sits on never depends on what happens to be behind the stack. Both',
          'presets keep `text.primary` and `text.secondary` above the WCAG AA 4.5:1 ratio on',
          'every colour the sweep passes through, in both modes —',
          '`gradient.contrast.test.ts` asserts it rather than leaving it to the eye.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <SurfaceSampler mode="light" args={args} />
      <SurfaceSampler mode="dark" args={args} />
    </Stack>
  ),
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

export const ReducedMotion: Story = {
  args: { variant: 'slide-up', duration: 0, backgroundDuration: 0 },
  parameters: {
    docs: {
      description: {
        story: [
          'The motion-free path, shown here with `duration={0}` and `backgroundDuration={0}`',
          '— the same thing anyone whose system sets `prefers-reduced-motion: reduce` gets',
          'without asking. The layout appears instantly, arranged exactly as it is with the',
          'animation on, and the gradient is held at its resting frame.',
          '',
          'A looping background is exactly the kind of ambient motion the preference is',
          "about, so the sweep stops — but the panel it decorates stays, because dropping",
          'the surface as well would change how the component looks rather than how it',
          'moves.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <AnimatedStack {...args} sx={PANEL_SX}>
      {CARDS.map((card) => (
        <Card key={card}>{card}</Card>
      ))}
    </AnimatedStack>
  ),
};
