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

### `ConfirmActions`

The reusable Ok/Cancel pair, published under its own subpath export. Ok comes
first in both the DOM and the visual order, so tab order follows what the user
sees, and both are plain MUI `Button`s — keyboard-focusable and activated with
Enter or Space. `onOk` and `onCancel` are separate callbacks, each firing once
per click:

```tsx
import { ConfirmActions } from 'loomshift-example/confirm-actions';

function Example({ onClose }: { onClose: () => void }) {
  return <ConfirmActions onOk={() => save().then(onClose)} onCancel={onClose} />;
}
```

Its most common home is a dialog's `DialogActions`. Labelling and focus trapping
come from the dialog, so `ConfirmActions` only renders the buttons:

```tsx
<AnimatedDialog open={open} onClose={close}>
  <DialogTitle>Delete project?</DialogTitle>
  <DialogContent>
    <DialogContentText>This removes the project for every member.</DialogContentText>
  </DialogContent>
  <DialogActions>
    <ConfirmActions confirmLabel="Delete" destructive onOk={destroy} onCancel={close} />
  </DialogActions>
</AnimatedDialog>
```

| Prop                          | Type                              | Default    |
| ----------------------------- | --------------------------------- | ---------- |
| `onOk`                        | `() => void \| PromiseLike<unknown>` (required) | — |
| `onCancel`                    | `() => void` (required)           | —          |
| `confirmLabel`                | `string`                          | `'Ok'`     |
| `cancelLabel`                 | `string`                          | `'Cancel'` |
| `emphasis`                    | `'high' \| 'low'`                 | `'high'`   |
| `align`                       | `'left' \| 'center' \| 'right'`   | `'right'`  |
| `pressVariant`                | `'scale' \| 'lift' \| 'none'`     | `'scale'`  |
| `duration`                    | `number` (milliseconds)           | `120`      |
| `easing`                      | Framer Motion easing              | `'easeInOut'` |
| `destructive`                 | `boolean`                         | `false`    |
| `pending`                     | `boolean`                         | —          |
| `disableConfirm`              | `boolean`                         | `false`    |
| `fullWidth`                   | `boolean`                         | `false`    |
| `okButtonProps` / `cancelButtonProps` | `ButtonProps`             | —          |

**Return the promise from `onOk`** and the confirm button tracks it for you: it
shows a spinner and stops accepting clicks for as long as the promise is in
flight, so a slow confirm cannot be submitted twice. Cancel stays interactive
throughout, unless you disable it yourself through `cancelButtonProps`.

```tsx
<ConfirmActions confirmLabel="Save" onOk={() => save().then(close)} onCancel={close} />
```

A rejected promise releases the button back to idle rather than leaving it stuck
— then rethrows, so a failed confirm is never silent. Catch it inside `onOk` to
show the error and keep the surface open:

```tsx
onOk={() => save().catch((error) => setError(error.message))}
```

Hosts that already track the async state can drive the same busy state with
`pending` instead. The two are additive, so `pending` never switches the promise
tracking off:

```tsx
<ConfirmActions confirmLabel="Save" pending={saving} onOk={save} onCancel={close} />
```

The spinner slot is reserved whenever `pending` is passed, which keeps the button
the same width in both states so nothing shifts. On a promise-tracked confirm the
slot only exists while the promise runs — pass `pending={false}` alongside it to
reserve the space up front.

Both buttons animate while they are held down, so a press feels answered
straight away. It works from mouse, touch and the keyboard (Enter and Space
activate a `<button>`, so they animate too), and it is purely visual: `onOk` and
`onCancel` fire from the click, never after the animation. Rapid clicks restart
the press from wherever the last one got to instead of queueing up.

`pressVariant` picks the preset — `'scale'` sinks the button, `'lift'` presses it
down towards the surface — and `duration`/`easing` tune it like everywhere else
in the library:

```tsx
<ConfirmActions pressVariant="lift" duration={200} onOk={save} onCancel={close} />
```

`pressVariant="none"` or `duration={0}` turns the motion off and leaves MUI's own
ripple as the feedback, which is also what anyone with
`prefers-reduced-motion: reduce` gets automatically.

Remaining props are forwarded to the underlying MUI `Stack`, so `sx` and
`spacing` work as usual.

## Customising or disabling the animation

[Framer Motion](https://www.framer.com/motion/) is the only motion source in the
library: every animation is a Framer Motion preset built on the shared tokens in
`src/shared/animation.ts`, never a hand-rolled effect. Adding a new animation
means adding a `variant` to an existing component. The reasoning, and the
matching decision on `ConfirmActions` button order and first surface, are
recorded on the **Decisions** page (`docs/Decisions.mdx`).

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
(`docs/Introduction.mdx`) is the landing page, and the `Decisions` page
(`docs/Decisions.mdx`) records the settled cross-component choices.
