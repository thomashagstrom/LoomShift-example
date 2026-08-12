import * as React from 'react';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AnimatedDialog } from '../AnimatedDialog';
import { ConfirmActions } from './ConfirmActions';

const meta = {
  title: 'Components/ConfirmActions',
  component: ConfirmActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The reusable Ok/Cancel pair any screen can drop in to get consistent',
          'confirm/cancel actions. Ok comes first in both the DOM and the visual order,',
          'so tabbing follows what the user sees, and both are plain MUI `Button`s —',
          'keyboard-focusable and activated with Enter or Space. It ships as its own',
          'feature slice with a subpath export.',
          '',
          "```tsx\nimport { ConfirmActions } from 'loomshift-example/confirm-actions';\n```",
        ].join('\n'),
      },
    },
  },
  argTypes: {
    confirmLabel: { table: { defaultValue: { summary: "'Ok'" } } },
    cancelLabel: { table: { defaultValue: { summary: "'Cancel'" } } },
    emphasis: {
      control: 'inline-radio',
      options: ['high', 'low'],
      table: { defaultValue: { summary: "'high'" } },
    },
    align: {
      control: 'inline-radio',
      options: ['left', 'center', 'right'],
      table: { defaultValue: { summary: "'right'" } },
    },
    destructive: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    pending: { control: 'boolean' },
    disableConfirm: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    fullWidth: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    onOk: { table: { disable: true } },
    onCancel: { table: { disable: true } },
  },
  args: {
    // Spies so the Actions panel records that each callback fired once.
    onOk: fn(),
    onCancel: fn(),
    confirmLabel: 'Ok',
    cancelLabel: 'Cancel',
    emphasis: 'high',
    align: 'right',
    destructive: false,
    pending: false,
    disableConfirm: false,
    fullWidth: false,
  },
} satisfies Meta<typeof ConfirmActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every prop is editable from the Controls panel. */
export const Playground: Story = {};

export const ButtonOrder: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The settled default: **Ok first, Cancel second** in both the DOM and the',
          'visual order, right-aligned (`align="right"`), so tab order follows what the',
          'user sees. The **modal confirmation dialog** is the first target surface —',
          'these defaults are tuned for a `DialogActions` footer, which is why the',
          'InDialog story needs no props beyond the callbacks. Inline forms are a',
          'supported second surface via `emphasis`, `align` and `fullWidth`. See the',
          'Decisions page for the reasoning.',
        ].join('\n'),
      },
    },
  },
  render: (args) => (
    <Stack sx={{ width: 320 }}>
      <ConfirmActions {...args} />
    </Stack>
  ),
};

export const InDialog: Story = {
  args: { confirmLabel: 'Delete', destructive: true },
  parameters: {
    docs: {
      description: {
        story:
          'The intended primary host. Focus trapping and labelling come from the dialog, not from this component — `ConfirmActions` only renders the two buttons inside `DialogActions`.',
      },
      // The dialog is fixed-positioned, so the docs block gets its own iframe.
      story: { inline: false, height: '260px' },
    },
  },
  render: (args) => (
    <AnimatedDialog open onClose={args.onCancel}>
      <DialogTitle>Delete project?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This removes the project and everything in it for every member.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <ConfirmActions {...args} />
      </DialogActions>
    </AnimatedDialog>
  ),
};

export const InlineFormFooter: Story = {
  args: { confirmLabel: 'Save', cancelLabel: 'Discard' },
  parameters: {
    docs: {
      description: {
        story:
          'Label overrides and use outside a modal: the pair sits in a bottom-right footer below a `Divider`.',
      },
    },
  },
  render: (args) => (
    <Stack spacing={2} sx={{ width: 320 }}>
      <TextField label="Project name" defaultValue="Loom" size="small" />
      <TextField label="Owner" defaultValue="platform-team" size="small" />
      <Divider />
      <ConfirmActions {...args} />
    </Stack>
  ),
};

export const Pending: Story = {
  args: { confirmLabel: 'Saving', pending: true },
  parameters: {
    docs: {
      description: {
        story:
          'The busy state held open. A host that owns the async state itself can set `pending` while its promise is in flight; returning that promise from `onOk` gets the same thing without the extra state. The confirm button shows a spinner and stops accepting clicks, Cancel stays interactive, and the reserved spinner slot keeps the button the same width in both states so nothing shifts.',
      },
    },
  },
};

export const PendingLifecycle: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          'The whole lifecycle, driven by a real promise: **return it from `onOk`** and',
          'the button tracks it — busy while it runs, idle again when it settles. Clicks',
          'that land during the busy state are dropped, so a slow confirm cannot be',
          'submitted twice. Flip the toggle to make the confirm fail: the button comes',
          'back to idle rather than staying stuck, and the host renders the error.',
        ].join('\n'),
      },
    },
  },
  render: function PendingLifecycleStory(args) {
    const [shouldFail, setShouldFail] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [confirms, setConfirms] = React.useState(0);

    const save = () =>
      new Promise<void>((resolve, reject) => {
        setTimeout(() => (shouldFail ? reject(new Error('Could not save. Try again.')) : resolve()), 1500);
      });

    return (
      <Stack spacing={2} sx={{ width: 360 }}>
        <FormControlLabel
          control={<Switch checked={shouldFail} onChange={(_, checked) => setShouldFail(checked)} />}
          label="Make the confirm fail"
        />
        <Typography variant="body2" color="text.secondary">
          onOk fired {confirms} {confirms === 1 ? 'time' : 'times'} — clicking Ok repeatedly while
          it runs leaves this at one per confirm.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Divider />
        <ConfirmActions
          {...args}
          confirmLabel="Save"
          onOk={() => {
            setConfirms((count) => count + 1);
            setError(null);
            args.onOk();
            // Handled here, so the button's rethrow has an owner: a failed
            // confirm shows an error instead of closing the surface.
            return save().catch((reason: Error) => {
              setError(reason.message);
            });
          }}
        />
      </Stack>
    );
  },
};

export const Destructive: Story = {
  args: { confirmLabel: 'Delete', destructive: true },
  parameters: {
    docs: {
      description: {
        story:
          'Colours the confirm button as a destructive action. Pair it with wording that names the consequence.',
      },
    },
  },
};

export const LowEmphasis: Story = {
  args: { emphasis: 'low' },
  parameters: {
    docs: {
      description: {
        story:
          'Use `emphasis="low"` where the pair is not the primary action on the screen — the confirm button renders `outlined` instead of `contained`.',
      },
    },
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: {
    docs: {
      description: {
        story: 'Both buttons stretch to share the container width — useful in narrow layouts.',
      },
    },
  },
  render: (args) => (
    <Stack sx={{ width: 260 }}>
      <ConfirmActions {...args} />
    </Stack>
  ),
};
