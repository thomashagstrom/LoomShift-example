import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook is the library's docs site: every component keeps its stories inside
 * its own feature slice, and the hand-written guides live in `docs/`.
 */
const config: StorybookConfig = {
  stories: ['../docs/**/*.mdx', '../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  typescript: {
    // Props tables are generated from the components' own TypeScript types, so
    // the docs can never drift from the published `.d.ts`.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      // Only the library sources are components; this also keeps the Storybook
      // config itself out of the docgen pass.
      include: ['src/**/*.tsx'],
      shouldExtractLiteralValuesFromEnum: true,
      // Each component forwards the entire MUI prop surface; documenting only
      // the props declared in this repository keeps the tables readable.
      propFilter: (prop) => !/node_modules/.test(prop.parent?.fileName ?? ''),
    },
  },
};

export default config;
