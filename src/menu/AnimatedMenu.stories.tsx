import * as React from 'react';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedMenu } from './AnimatedMenu';

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
          'export. Every MUI `Menu` prop is forwarded, so it triggers from and',
          'positions against any element exactly like a plain MUI `Menu`, and its',
          'colours, spacing and typography come from the theme automatically. Users',
          'who set `prefers-reduced-motion` get an instant, motion-free transition.',
          '',
          "```tsx\nimport { AnimatedMenu } from 'loomshift-example/menu';\n```",
        ].join('\n'),
      },
    },
  },
  argTypes: {
    transitionVariant: {
      control: 'select',
      options: ['fade', 'grow', 'slide-down', 'slide-up'],
      table: { defaultValue: { summary: "'grow'" } },
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
    // `open`/`anchorEl` are driven by the trigger button in each story's
    // `render`, not the Controls panel: a menu has to be anchored to a real
    // DOM element, which a control can't hand it.
    open: {
      control: false,
      table: { disable: true },
    },
    anchorEl: {
      control: false,
      table: { disable: true },
    },
  },
  args: {
    // Closed by default: every story's whole point is "open the menu from the
    // trigger button" (see the component description above), and the trigger
    // rendered by `render` below can't be reached if the menu already covers
    // it on first load.
    open: false,
    transitionVariant: 'grow',
    duration: 250,
    easing: 'easeInOut',
  },
  render: function Render(args) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    return (
      <>
        <Button
          variant="contained"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
        >
          Open menu
        </Button>
        <AnimatedMenu {...args} anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>My account</MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>Log out</MenuItem>
        </AnimatedMenu>
      </>
    );
  },
} satisfies Meta<typeof AnimatedMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every animation prop is editable from the Controls panel. */
export const Playground: Story = {};

export const Grow: Story = {
  args: { transitionVariant: 'grow' },
};

export const Fade: Story = {
  args: { transitionVariant: 'fade' },
};

export const SlideDown: Story = {
  args: { transitionVariant: 'slide-down' },
};

export const SlideUp: Story = {
  args: { transitionVariant: 'slide-up' },
};

export const TriggeredFromAnIconButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The menu triggers from and positions against `anchorEl` — any element, not just a `Button`.',
      },
    },
  },
  render: function Render(args) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    return (
      <>
        <IconButton
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
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
            <ListItemIcon />
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </AnimatedMenu>
      </>
    );
  },
};

export const CustomTiming: Story = {
  args: {
    transitionVariant: 'slide-down',
    duration: 600,
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

export const NoAnimation: Story = {
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
