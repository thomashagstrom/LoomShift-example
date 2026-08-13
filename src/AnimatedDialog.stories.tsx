import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { AnimatedDialog } from './AnimatedDialog';
import { ConfirmActions } from './confirm-actions/ConfirmActions';

const meta = {
  title: 'Components/AnimatedDialog',
  component: AnimatedDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A drop-in replacement for MUI’s `Dialog` that animates its enter/exit with',
          'Framer Motion out of the box. Every MUI `Dialog` prop is forwarded, so',
          'accessibility roles and focus trapping are preserved, and users who set',
          '`prefers-reduced-motion` get an instant, motion-free transition.',
          '',
          'Every story below is a real flow: open the dialog from the trigger button and',
          'the footer is the shared `ConfirmActions` pair, so the press animation, Esc,',
          'Cancel and the focus handover are all reachable from here.',
          '',
          "```tsx\nimport { AnimatedDialog } from 'loomshift-example';\n```",
        ].join('\n'),
      },
      // The dialog is a fixed-position portal, so each docs block renders in its
      // own iframe instead of overlaying the whole page.
      story: { inline: false, height: '360px' },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['fade', 'zoom', 'slide-up', 'slide-down'],
      table: { defaultValue: { summary: "'zoom'" } },
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
      description: 'Forwarded to MUI `Dialog`. Toggle it to replay the animation.',
      table: { type: { summary: 'boolean' } },
    },
  },
  args: {
    open: true,
    variant: 'zoom',
    duration: 250,
    easing: 'easeInOut',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();
    const close = () => updateArgs({ open: false });

    return (
      <>
        <Button variant="contained" onClick={() => updateArgs({ open: true })}>
          Open dialog
        </Button>
        <AnimatedDialog {...args} onClose={close}>
          <DialogTitle>Publish release?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This pushes the current build to production. You can roll back afterwards.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            {/* `autoFocus` lands focus on the confirm button as the dialog opens;
                MUI's focus trap hands it back to the trigger on close. */}
            <ConfirmActions
              confirmLabel="Publish"
              onOk={close}
              onCancel={close}
              okButtonProps={{ autoFocus: true }}
            />
          </DialogActions>
        </AnimatedDialog>
      </>
    );
  },
} satisfies Meta<typeof AnimatedDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every animation prop is editable from the Controls panel. */
export const Playground: Story = {};

export const Zoom: Story = {
  args: { variant: 'zoom' },
};

export const Fade: Story = {
  args: { variant: 'fade' },
};

export const SlideUp: Story = {
  args: { variant: 'slide-up' },
};

export const SlideDown: Story = {
  args: { variant: 'slide-down' },
};

export const CustomTiming: Story = {
  args: { variant: 'slide-up', duration: 600, easing: [0.22, 1, 0.36, 1] },
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
