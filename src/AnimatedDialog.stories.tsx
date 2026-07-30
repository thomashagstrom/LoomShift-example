import * as React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimatedDialog } from './AnimatedDialog';

/** Named Framer Motion curves, offered as a dropdown in the Controls panel. */
const EASING_OPTIONS = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'anticipate'];

/** The args Storybook builds from the component — `ref` is never a story arg. */
type DialogArgs = Omit<React.ComponentProps<typeof AnimatedDialog>, 'ref'>;

/**
 * Interactive harness for the stories: `open` stays editable from the Controls
 * panel, while the trigger button lets readers replay the enter/exit animation
 * as many times as they like.
 */
function DialogDemo({
  open,
  // The story supplies the dialog body, so any `children` arg is ignored.
  children: _children,
  ...dialogProps
}: DialogArgs) {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => setIsOpen(open), [open]);

  return (
    <>
      <Button variant="contained" onClick={() => setIsOpen(true)}>
        Open dialog
      </Button>
      <AnimatedDialog {...dialogProps} open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Publish changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Every MUI `Dialog` prop is forwarded, so focus trapping and the
            `role="dialog"` semantics behave exactly as they do upstream.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setIsOpen(false)}>
            Publish
          </Button>
        </DialogActions>
      </AnimatedDialog>
    </>
  );
}

const meta = {
  title: 'Feedback/AnimatedDialog',
  component: AnimatedDialog,
  tags: ['autodocs'],
  render: (args) => <DialogDemo {...args} />,
  args: {
    open: true,
    variant: 'zoom',
    duration: 250,
    easing: 'easeInOut',
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Standard MUI `Dialog` prop. Toggle it to drive the animation.',
    },
    variant: {
      control: 'select',
      options: ['fade', 'zoom', 'slide-up', 'slide-down'],
    },
    duration: {
      control: { type: 'range', min: 0, max: 1200, step: 50 },
      description: 'Milliseconds. `0` disables the animation.',
    },
    easing: { control: 'select', options: EASING_OPTIONS },
  },
  parameters: {
    // Dialogs render into a portal and cover the viewport; giving each story its
    // own frame keeps the overlay inside the story canvas instead of hiding the
    // surrounding docs page.
    docs: { story: { inline: false, height: '340px' } },
  },
} satisfies Meta<typeof AnimatedDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The defaults: a 250ms `zoom` with `easeInOut`, no configuration required. */
export const Default: Story = {};

export const Fade: Story = {
  args: { variant: 'fade' },
};

export const SlideUp: Story = {
  args: { variant: 'slide-up' },
};

export const SlideDown: Story = {
  args: { variant: 'slide-down' },
};

/** Customizing the default animation: a slower slide on a springier curve. */
export const CustomAnimation: Story = {
  args: { variant: 'slide-up', duration: 600, easing: 'anticipate' },
};

/**
 * Disabling the animation: `duration={0}` makes the dialog appear instantly,
 * which is also what users who set `prefers-reduced-motion` always get.
 */
export const NoAnimation: Story = {
  args: { duration: 0 },
};
