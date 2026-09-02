import * as React from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedMenu } from './AnimatedMenu';
import type { AnimatedMenuEasing, AnimatedMenuVariant } from './types';

interface MenuDemoProps {
  animationVariant?: AnimatedMenuVariant;
  duration?: number;
  easing?: AnimatedMenuEasing;
}

/**
 * A menu triggered from its own anchor button, since `AnimatedMenu` — like
 * MUI's `Menu` — needs a mounted `anchorEl` to position itself against.
 */
function MenuDemo(props: MenuDemoProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <Button variant="contained" onClick={(event) => setAnchorEl(event.currentTarget)}>
        Open menu
      </Button>
      <AnimatedMenu
        {...props}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>My account</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Logout</MenuItem>
      </AnimatedMenu>
    </>
  );
}

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
          'export. `anchorEl` still pops it up from any element on the page, and every',
          'MUI `Menu` prop is forwarded, so its accessibility baseline — `role="menu"`,',
          'roving focus and dismissal on Escape or an outside click — is preserved.',
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
  },
  args: {
    // `MenuDemo` owns `open`/`anchorEl` itself, driven by its own trigger
    // button — this only satisfies `Meta`'s type, which otherwise requires
    // every prop `Menu` itself marks as required.
    open: true,
    animationVariant: 'grow',
    duration: 250,
    easing: 'easeInOut',
  },
  render: (args) => <MenuDemo {...args} />,
} satisfies Meta<typeof AnimatedMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every animation prop is editable from the Controls panel. */
export const Playground: Story = {};

export const Grow: Story = {
  args: { animationVariant: 'grow' },
};

export const Fade: Story = {
  args: { animationVariant: 'fade' },
};

export const SlideDown: Story = {
  args: { animationVariant: 'slide-down' },
};

export const WithSelection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A menu built from `MenuItem`s, closing itself through `onClose` the same way it does on Escape or a click outside — the animation is purely presentational and never affects `Menu`’s own selection or focus behaviour.',
      },
    },
  },
  render: function Render(args) {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const options = ['Edit', 'Duplicate', 'Archive', 'Delete'];

    return (
      <>
        <Button variant="outlined" onClick={(event) => setAnchorEl(event.currentTarget)}>
          {selected ? `Selected: ${selected}` : 'Choose an action'}
        </Button>
        <AnimatedMenu
          {...args}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {options.map((option) => (
            <MenuItem
              key={option}
              onClick={() => {
                setSelected(option);
                setAnchorEl(null);
              }}
            >
              {option}
            </MenuItem>
          ))}
        </AnimatedMenu>
      </>
    );
  },
};

export const CustomTiming: Story = {
  args: { animationVariant: 'grow', duration: 600, easing: [0.22, 1, 0.36, 1] },
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
