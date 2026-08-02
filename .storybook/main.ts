import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../docs/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    // Props tables are generated from the TSDoc on `AnimatedDialogProps` /
    // `AnimatedSnackbarProps`. Props inherited from MUI are filtered out so the
    // table documents what this library adds rather than all of `DialogProps`.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        !prop.declarations?.some((declaration) =>
          declaration.fileName.includes('node_modules'),
        ),
    },
  },
};

export default config;
