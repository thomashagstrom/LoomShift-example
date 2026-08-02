import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Preview } from '@storybook/react-vite';

/**
 * One theme per toolbar option. `CssBaseline` paints the surface with
 * `background.default`, so every story previews on a neutral MUI background.
 */
const themes = {
  light: createTheme({ palette: { mode: 'light' } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
};

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    docs: { toc: true },
  },
  globalTypes: {
    theme: {
      description: 'MUI palette mode',
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
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme as keyof typeof themes;
      return (
        <ThemeProvider theme={themes[mode] ?? themes.light}>
          <CssBaseline />
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
