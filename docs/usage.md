# Usage

Technical usage examples for every component. For a plain-language overview
of what each component is for, see [components.md](./components.md).

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

## Customising or disabling the animation

`duration` and `easing` are shared by every component, so you can map them onto
your own motion tokens. `easing` accepts any Framer Motion easing — a named
curve or a cubic-bezier array:

```tsx
<AnimatedDialog
  open={open}
  onClose={close}
  variant="slide-up"
  duration={600}
  easing={[0.22, 1, 0.36, 1]}
>
  {/* … */}
</AnimatedDialog>
```

To turn the animation **off**, pass `duration={0}`. The component still mounts
and unmounts through the same lifecycle, it just transitions instantly:

```tsx
<AnimatedSnackbar open={open} onClose={close} duration={0}>
  <Alert severity="success">Saved</Alert>
</AnimatedSnackbar>
```

You rarely need to opt out by hand: anyone whose system sets
`prefers-reduced-motion: reduce` already gets the instant transition.

## Interactive docs

An interactive [Storybook](https://storybook.js.org/) covers every component
with live previews, an auto-generated props table and editable controls for
`variant`, `duration`, `easing` and `open`:

```sh
npm run storybook        # dev server on http://localhost:6006
npm run build-storybook  # static site in storybook-static/
```

Stories live next to the component they document (`src/**/*.stories.tsx`), so a
feature slice ships its docs with its code. The `Introduction` page
(`docs/Introduction.mdx`) is the landing page.
