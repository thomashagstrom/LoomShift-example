import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { AnimatedSnackbar } from './AnimatedSnackbar';

const meta = {
  title: 'Components/AnimatedSnackbar',
  component: AnimatedSnackbar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A drop-in replacement for MUI’s `Snackbar` that animates its enter/exit with',
          'Framer Motion, built as an independent feature slice with its own subpath',
          'export. Every MUI `Snackbar` prop is forwarded, and users who set',
          '`prefers-reduced-motion` get an instant, motion-free transition.',
          '',
          "```tsx\nimport { AnimatedSnackbar } from 'loomshift-example/snackbar';\n```",
        ].join('\n'),
      },
      // The snackbar is fixed-positioned, so each docs block renders in its own
      // iframe instead of anchoring to the bottom of the whole page.
      story: { inline: false, height: '260px' },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['fade', 'grow', 'slide-up', 'slide-down'],
      table: { defaultValue: { summary: "'slide-up'" } },
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
      description: 'Forwarded to MUI `Snackbar`. Toggle it to replay the animation.',
      table: { type: { summary: 'boolean' } },
    },
  },
  args: {
    open: true,
    message: 'Changes saved',
    variant: 'slide-up',
    duration: 250,
    easing: 'easeInOut',
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs();

    return (
      <>
        <Button variant="contained" onClick={() => updateArgs({ open: true })}>
          Show snackbar
        </Button>
        <AnimatedSnackbar {...args} onClose={() => updateArgs({ open: false })} />
      </>
    );
  },
} satisfies Meta<typeof AnimatedSnackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every animation prop is editable from the Controls panel. */
export const Playground: Story = {};

export const SlideUp: Story = {
  args: { variant: 'slide-up', message: 'Slides up from the bottom' },
};

export const Grow: Story = {
  args: { variant: 'grow', message: 'Grows into view' },
};

export const Fade: Story = {
  args: { variant: 'fade', message: 'Fades in and out' },
};

export const WithAlert: Story = {
  args: { variant: 'fade' },
  render: function Render(args) {
    const [, updateArgs] = useArgs();

    return (
      <>
        <Button variant="contained" onClick={() => updateArgs({ open: true })}>
          Show snackbar
        </Button>
        <AnimatedSnackbar {...args} message={undefined} onClose={() => updateArgs({ open: false })}>
          <Alert severity="success">Profile updated</Alert>
        </AnimatedSnackbar>
      </>
    );
  },
};

export const CustomTiming: Story = {
  args: {
    variant: 'slide-up',
    duration: 600,
    easing: [0.22, 1, 0.36, 1],
    message: 'Slower, custom easing',
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
  args: { duration: 0, message: 'Appears instantly' },
  parameters: {
    docs: {
      description: {
        story:
          'Set `duration={0}` to disable the animation and get an instant transition — the same behaviour users with `prefers-reduced-motion` see automatically.',
      },
    },
  },
};
