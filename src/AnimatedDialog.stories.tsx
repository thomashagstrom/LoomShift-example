import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { AnimatedDialog } from './AnimatedDialog';
import { ConfirmActions } from './confirm-actions/ConfirmActions';
import { AnimatedSnackbar } from './snackbar/AnimatedSnackbar';
import { AnimatedStack } from './stack/AnimatedStack';

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
          'Cancel and the focus handover are all reachable from here. Confirming closes',
          'the dialog and leaves a `Release published` confirmation on the page, since a',
          'dialog that just disappears never tells the user the action landed.',
          '',
          'Pass `onConfirm`/`onCancel` and that footer comes built in: the dialog renders',
          'the pair for you and closes itself through `onClose` once your callback has',
          'run, with a `reason` of `confirm` or `cancel`. Compose your own `DialogActions`',
          'in `children` instead when you need a different footer.',
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
    const [published, setPublished] = React.useState(false);
    const close = () => updateArgs({ open: false });
    const dismissConfirmation = () => setPublished(false);
    // Confirming publishes; the dialog closes itself afterwards, so the outcome
    // is acknowledged on the page behind it rather than vanishing with it.
    const publish = () => setPublished(true);

    return (
      <>
        <Button variant="contained" onClick={() => updateArgs({ open: true })}>
          Open dialog
        </Button>
        {/* `onConfirm` is all the footer takes: the dialog renders the Ok/Cancel
            pair, focuses Ok as it opens, and closes through `onClose`. */}
        <AnimatedDialog
          {...args}
          onClose={close}
          onConfirm={publish}
          confirmActionsProps={{ confirmLabel: 'Publish' }}
        >
          <DialogTitle>Publish release?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This pushes the current build to production. You can roll back afterwards.
            </DialogContentText>
          </DialogContent>
        </AnimatedDialog>
        <AnimatedSnackbar open={published} autoHideDuration={4000} onClose={dismissConfirmation}>
          <Alert severity="success" onClose={dismissConfirmation}>
            Release published
          </Alert>
        </AnimatedSnackbar>
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

export const UndismissableBackdrop: Story = {
  args: { disableBackdropDismiss: true, disableEscapeKeyDown: true },
  parameters: {
    docs: {
      description: {
        story: [
          'A dialog is dismissable by default: clicking the backdrop or pressing Esc closes',
          'it through `onClose` with a reason of `backdropClick` or `escapeKeyDown`, and',
          'focus returns to the trigger button either way. Reserve the two opt-outs —',
          '`disableBackdropDismiss` and MUI’s `disableEscapeKeyDown`, both set here — for a',
          'dialog that must be answered: with them on, only Publish and Cancel close it.',
        ].join('\n'),
      },
    },
  },
};

export const WithAnimatedStack: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'Nest an `AnimatedStack` as the dialog’s container and the title, body and',
          '`ConfirmActions` become its direct flex items: one column, even spacing and the',
          'ambient gradient surface behind all three, for free. The footer is composed by',
          'hand here rather than through `onConfirm`, because it has to sit inside the',
          'stack to be one of those flex items. Nothing about the dialog',
          'changes — labelling, focus trapping and `open` all still come from',
          '`AnimatedDialog` — so `duration={0}` and `prefers-reduced-motion` collapse both',
          'the dialog transition and the stack’s enter animation, leaving the gradient as a',
          'static wash.',
        ].join('\n'),
      },
    },
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
          <AnimatedStack direction="column" spacing={1}>
            <DialogTitle>Publish release?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                This pushes the current build to production. You can roll back afterwards.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <ConfirmActions
                confirmLabel="Publish"
                onOk={close}
                onCancel={close}
                okButtonProps={{ autoFocus: true }}
              />
            </DialogActions>
          </AnimatedStack>
        </AnimatedDialog>
      </>
    );
  },
};
