import * as React from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { AnimatedMenu } from './AnimatedMenu';
import type { AnimatedMenuVariant } from './types';

const meta = {
  title: 'Components/AnimatedMenu',
  component: AnimatedMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A drop-in replacement for MUI’s `Menu` that animates its enter/exit with',
          'Framer Motion, built as an independent feature slice with its own subpath',
          'export. Every MUI `Menu` prop is forwarded, so it opens from any element —',
          'a button, an icon, a table row — through the standard `anchorEl`/`open`',
          'pair, and every visual detail keeps coming from the surrounding theme.',
          'Users who set `prefers-reduced-motion` get an instant, motion-free',
          'transition.',
          '',
          "```tsx\nimport { AnimatedMenu } from 'loomshift-example/menu';\n```",
        ].join('\n'),
      },
    },
  },
  argTypes: {
    animationVariant: {
      control: 'inline-radio',
      options: ['fade', 'grow'],
      table: { defaultValue: { summary: "'fade'" } },
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
    open: {
      control: 'boolean',
      description: 'Forwarded to MUI `Menu`. Toggle it to replay the animation.',
      table: { type: { summary: 'boolean' } },
    },
  },
  args: {
    open: false,
    animationVariant: 'fade',
    duration: 250,
    easing: 'easeInOut',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    return (
      <>
        <Button
          variant="contained"
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
            updateArgs({ open: true });
          }}
        >
          Open menu
        </Button>
        <AnimatedMenu
          {...args}
          anchorEl={anchorEl}
          onClose={() => updateArgs({ open: false })}
        >
          <MenuItem onClick={() => updateArgs({ open: false })}>Profile</MenuItem>
          <MenuItem onClick={() => updateArgs({ open: false })}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={() => updateArgs({ open: false })}>Logout</MenuItem>
        </AnimatedMenu>
      </>
    );
  },
} satisfies Meta<typeof AnimatedMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every animation prop is editable from the Controls panel. */
export const Playground: Story = {};

export const Fade: Story = {
  args: { animationVariant: 'fade' },
};

export const Grow: Story = {
  args: { animationVariant: 'grow' },
};

/** The two presets side by side, each triggered from its own button. */
export const Variants: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The two enter presets, built on the same shared tokens as the rest of the',
          'library (`250ms`, `easeInOut`). Open each to compare a plain fade against a',
          'fade paired with a scale.',
        ].join('\n'),
      },
    },
  },
  render: function VariantsStory() {
    return (
      <>
        {(['fade', 'grow'] as AnimatedMenuVariant[]).map((variant) => (
          <VariantMenu key={variant} variant={variant} />
        ))}
      </>
    );
  },
};

function VariantMenu({ variant }: { variant: AnimatedMenuVariant }) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        sx={{ mr: 2 }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        animationVariant=&quot;{variant}&quot;
      </Button>
      <AnimatedMenu
        animationVariant={variant}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Logout</MenuItem>
      </AnimatedMenu>
    </>
  );
}

export const WithIconTrigger: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          '`anchorEl` accepts any element, not just a `Button` — here the trigger is an',
          '`IconButton`, the common pattern for row and card overflow menus.',
        ].join('\n'),
      },
    },
  },
  render: function IconTriggerStory(args) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    return (
      <>
        <IconButton aria-label="More actions" onClick={(event) => setAnchorEl(event.currentTarget)}>
          ⋮
        </IconButton>
        <AnimatedMenu {...args} anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        </AnimatedMenu>
      </>
    );
  },
};

export const CustomTiming: Story = {
  args: {
    animationVariant: 'grow',
    duration: 500,
    easing: [0.22, 1, 0.36, 1],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Override `duration` and `easing` to match your own motion tokens. `easing` accepts any Framer Motion easing — a named curve or a cubic-bezier array.',
      },
    },
  },
};

export const ReducedMotion: Story = {
  args: { duration: 0 },
  parameters: {
    docs: {
      description: {
        story:
          'Set `duration={0}` to disable the animation and get an instant transition — the same behaviour users with `prefers-reduced-motion` see automatically.',
      },
    },
  },
};
