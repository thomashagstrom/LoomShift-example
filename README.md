# LoomShift-example

code created by LoomShift GitHub app

A TypeScript component library scaffold. Built with [tsup](https://tsup.egoist.dev/),
it emits ESM + CJS bundles and type declarations from a single build command.

Every component has a live playground with editable prop controls — run
`npm run storybook` (see [Documentation](#documentation)).

## Install

```sh
npm install loomshift-example
```

### Peer dependencies

MUI and Framer Motion (and their runtime peers) are declared as `peerDependencies`
so they are **not** bundled — the consuming app provides a single shared copy.
Install them alongside this package if you haven't already:

| Package             | Supported range                     |
| ------------------- | ----------------------------------- |
| `react`             | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` |
| `react-dom`         | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0` |
| `@mui/material`     | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0`    |
| `@emotion/react`    | `^11.0.0`                           |
| `@emotion/styled`   | `^11.0.0`                           |
| `framer-motion`     | `^10.0.0 \|\| ^11.0.0 \|\| ^12.0.0` |

```sh
npm install @mui/material @emotion/react @emotion/styled framer-motion react react-dom
```

## Components

### `AnimatedDialog`

A drop-in replacement for MUI's `Dialog` that animates its enter/exit with
[Framer Motion](https://www.framer.com/motion/) out of the box. Every MUI
`Dialog` prop is forwarded, so accessibility roles (`role="dialog"`,
`aria-modal`, labelling) and focus trapping are preserved. It also honours
`prefers-reduced-motion` by collapsing the animation to an instant transition.

```tsx
import { useState } from 'react';
import { Button, DialogTitle, DialogContent } from '@mui/material';
import { AnimatedDialog } from 'loomshift-example';

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <AnimatedDialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Hello</DialogTitle>
        <DialogContent>It animates automatically.</DialogContent>
      </AnimatedDialog>
    </>
  );
}
```

Animation is configured through optional, fully typed props with sensible
defaults:

| Prop       | Type                                            | Default        |
| ---------- | ----------------------------------------------- | -------------- |
| `variant`  | `'fade' \| 'zoom' \| 'slide-up' \| 'slide-down'`| `'zoom'`       |
| `duration` | `number` (milliseconds)                         | `250`          |
| `easing`   | Framer Motion easing                            | `'easeInOut'`  |

```tsx
<AnimatedDialog open={open} onClose={close} variant="slide-up" duration={400}>
  {/* … */}
</AnimatedDialog>
```

### `AnimatedSnackbar`

A drop-in replacement for MUI's `Snackbar` that animates its enter/exit with
Framer Motion, built as an **independent feature slice**. It reuses the same
shared animation defaults as `AnimatedDialog` (`250ms`, `easeInOut`, and the
`prefers-reduced-motion` handling) and is published under its own subpath
export, so importing it never pulls in unrelated components:

```tsx
import { useState } from 'react';
import { Button, Alert } from '@mui/material';
import { AnimatedSnackbar } from 'loomshift-example/snackbar';

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Save</Button>
      <AnimatedSnackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        variant="slide-up"
      >
        <Alert severity="success">Changes saved</Alert>
      </AnimatedSnackbar>
    </>
  );
}
```

Every MUI `Snackbar` prop is forwarded. Animation is configured through the
same optional, fully typed props as `AnimatedDialog`:

| Prop       | Type                                            | Default        |
| ---------- | ----------------------------------------------- | -------------- |
| `variant`  | `'fade' \| 'grow' \| 'slide-up' \| 'slide-down'`| `'slide-up'`   |
| `duration` | `number` (milliseconds)                         | `250`          |
| `easing`   | Framer Motion easing                            | `'easeInOut'`  |

## Customizing the animation

`variant`, `duration` and `easing` are optional on every component, so the
defaults above apply until you override them:

```tsx
<AnimatedSnackbar open={open} onClose={close} variant="grow" duration={600} easing="anticipate">
  <Alert severity="info">Slower, springier</Alert>
</AnimatedSnackbar>
```

### Disabling the animation

Pass `duration={0}` for an instant, motion-free transition:

```tsx
<AnimatedDialog open={open} onClose={close} duration={0}>
  <DialogTitle>No animation</DialogTitle>
</AnimatedDialog>
```

That is exactly what visitors who set `prefers-reduced-motion: reduce` get
automatically — the shared transition collapses the duration to zero for them,
with no configuration on your side.

## Documentation

The docs site is a [Storybook](https://storybook.js.org/): a live playground per
component with editable controls for `open`, `variant`, `duration`, `easing`
(and `autoHideDuration` on the snackbar), plus a props table generated from each
component's own TypeScript types.

```sh
npm run storybook        # start the docs site on http://localhost:6006
npm run build-storybook  # build the static site into storybook-static/
```

- `Getting Started` mirrors this README (install, peer deps, first component).
- `Feedback/AnimatedDialog` and `Feedback/AnimatedSnackbar` document each
  component, including `Custom Animation` and `No Animation` stories.

Stories live next to the component they document (`src/**/*.stories.tsx`), so a
feature slice always ships its own docs. `src/stories.test.tsx` renders every
story in the unit-test run, so a broken example fails CI instead of the docs.

## Development

```sh
npm install        # install dev dependencies
npm run build      # produce dist/ (ESM + CJS + .d.ts) in one command
npm run typecheck  # type-check without emitting
npm test           # run the unit tests (Vitest + Testing Library)
npm run storybook  # start the docs site (see Documentation)
```

The build writes:

- `dist/index.js`   — ESM bundle (`module` / `exports.import`)
- `dist/index.cjs`  — CommonJS bundle (`main` / `exports.require`)
- `dist/index.d.ts` — type declarations (`types`)

## Publishing

`prepublishOnly` runs the build, so the compiled `dist/` is always fresh:

```sh
npm publish --dry-run   # verify the packed contents
npm publish
```
