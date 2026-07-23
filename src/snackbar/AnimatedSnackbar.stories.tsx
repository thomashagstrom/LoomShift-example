import * as React from 'react';
import Alert from '@mui/material/Alert';
import { AnimatedSnackbar } from './AnimatedSnackbar';
import type { AnimatedSnackbarProps } from './types';

/**
 * Storybook Component Story Format (CSF). Kept framework-light — typed against
 * the component's own props rather than `@storybook/react` — so the slice
 * ships its story without adding a Storybook dependency to the library.
 */
const meta = {
  title: 'Feedback/AnimatedSnackbar',
  component: AnimatedSnackbar,
  args: {
    open: true,
    message: 'Changes saved',
    variant: 'slide-up',
  } satisfies Partial<AnimatedSnackbarProps>,
};

export default meta;

type Story = {
  args?: Partial<AnimatedSnackbarProps>;
  render?: (args: Omit<AnimatedSnackbarProps, 'ref'>) => React.ReactElement;
};

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
  render: (args) => (
    <AnimatedSnackbar {...args}>
      <Alert severity="success">Profile updated</Alert>
    </AnimatedSnackbar>
  ),
};
