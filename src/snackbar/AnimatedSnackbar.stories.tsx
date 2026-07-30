import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedSnackbar } from './AnimatedSnackbar';

/** Named Framer Motion curves, offered as a dropdown in the Controls panel. */
const EASING_OPTIONS = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'anticipate'];

/** The args Storybook builds from the component — `ref` is never a story arg. */
type SnackbarArgs = Omit<React.ComponentProps<typeof AnimatedSnackbar>, 'ref'>;

/**
 * Interactive harness for the stories: `open` stays editable from the Controls
 * panel, while the trigger button lets readers replay the enter/exit animation
 * as many times as they like.
 */
function SnackbarDemo({ open, ...snackbarProps }: SnackbarArgs) {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => setIsOpen(open), [open]);

  return (
    <>
      <Button variant="contained" onClick={() => setIsOpen(true)}>
        Show snackbar
      </Button>
      <AnimatedSnackbar {...snackbarProps} open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

const meta = {
  title: 'Feedback/AnimatedSnackbar',
  component: AnimatedSnackbar,
  tags: ['autodocs'],
  render: (args) => <SnackbarDemo {...args} />,
  args: {
    open: true,
    message: 'Changes saved',
    variant: 'slide-up',
    duration: 250,
    easing: 'easeInOut',
    autoHideDuration: 4000,
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Standard MUI `Snackbar` prop. Toggle it to drive the animation.',
    },
    variant: {
      control: 'select',
      options: ['fade', 'grow', 'slide-up', 'slide-down'],
    },
    duration: {
      control: { type: 'range', min: 0, max: 1200, step: 50 },
      description: 'Milliseconds. `0` disables the animation.',
    },
    easing: { control: 'select', options: EASING_OPTIONS },
    autoHideDuration: {
      control: 'number',
      description: 'Forwarded MUI prop — the exit animation runs when it elapses.',
    },
  },
  parameters: {
    // Snackbars are fixed-position; giving each story its own frame stops them
    // from stacking on top of each other on the docs page.
    docs: { story: { inline: false, height: '200px' } },
  },
} satisfies Meta<typeof AnimatedSnackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The defaults: a 250ms `slide-up` with `easeInOut`, no configuration required. */
export const SlideUp: Story = {
  args: { variant: 'slide-up', message: 'Slides up from the bottom' },
};

export const Grow: Story = {
  args: { variant: 'grow', message: 'Grows into view' },
};

export const Fade: Story = {
  args: { variant: 'fade', message: 'Fades in and out' },
};

/** `children` replace the default `message` content, just like in MUI. */
export const WithAlert: Story = {
  args: {
    variant: 'fade',
    children: <Alert severity="success">Profile updated</Alert>,
  },
};

/** Customizing the default animation: a slower slide on a springier curve. */
export const CustomAnimation: Story = {
  args: { duration: 600, easing: 'anticipate', message: 'Slower, springier slide' },
};

/**
 * Disabling the animation: `duration={0}` makes the snackbar appear instantly,
 * which is also what users who set `prefers-reduced-motion` always get.
 */
export const NoAnimation: Story = {
  args: { duration: 0, message: 'No animation at all' },
};
