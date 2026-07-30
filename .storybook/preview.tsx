import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Decorator, Preview } from '@storybook/react-vite';

const THEMES = {
  light: createTheme({ palette: { mode: 'light' } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
};

/**
 * Every story renders inside a MUI theme, exactly as it would in a consuming
 * app. The palette mode is switchable from the toolbar so animations can be
 * reviewed against both backgrounds.
 */
const withMuiTheme: Decorator = (Story, context) => {
  const mode = context.globals.theme === 'dark' ? 'dark' : 'light';

  return (
    <ThemeProvider theme={THEMES[mode]}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  );
};

const preview: Preview = {
  decorators: [withMuiTheme],
  initialGlobals: { theme: 'light' },
  globalTypes: {
    theme: {
      description: 'MUI palette mode applied to every story',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: { expanded: true },
    docs: { toc: true },
  },
};

export default preview;
