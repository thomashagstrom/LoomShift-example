import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/snackbar/index.ts', 'src/confirm-actions/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Peer dependencies must stay external so they are resolved from the
  // consumer's app rather than bundled into this library.
  external: [
    'react',
    'react-dom',
    '@mui/material',
    '@emotion/react',
    '@emotion/styled',
    'framer-motion',
  ],
});
