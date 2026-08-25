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

#### Dismissing the dialog

The dialog is dismissable out of the box: clicking the backdrop or pressing Esc
calls `onClose`, with a `reason` of `'backdropClick'` or `'escapeKeyDown'` so a
host can tell a dismissal from the `'confirm'` and `'cancel'` the built-in footer
reports. Focus returns to the element that opened the dialog on the way out —
that is MUI's focus trap, so it costs nothing extra:

```tsx
<AnimatedDialog
  open={open}
  onClose={(event, reason) => {
    if (reason === 'confirm') save();
    setOpen(false);
  }}
>
  {/* … */}
</AnimatedDialog>
```

Neither route is visible, so the dialog also puts a × button in the corner of its
header — pinned there whatever the header is composed of — which closes it with a
reason of `'closeButton'` and hands focus back the same way. `closeButtonLabel`
sets its accessible name (`'Close'` by default), and `hideCloseButton` drops it
for a header that carries its own:

```tsx
<AnimatedDialog open={open} onClose={close} closeButtonLabel="Stäng">
  {/* … */}
</AnimatedDialog>
```

For a dialog that must be answered — a destructive confirm, say — turn the routes
off. `disableBackdropDismiss` ignores outside clicks, MUI's own
`disableEscapeKeyDown` ignores the key and `hideCloseButton` takes the × away; the
built-in Ok/Cancel footer is then the only way out:

```tsx
<AnimatedDialog
  open={open}
  onClose={close}
  disableBackdropDismiss
  disableEscapeKeyDown
  hideCloseButton
>
  {/* … */}
</AnimatedDialog>
```

#### With `AnimatedStack` as the container

Nest an [`AnimatedStack`](#animatedstack) as the dialog's only child and the
title, body and actions become its direct flex items — one column, even spacing
and the ambient gradient surface behind all three, with no styling of your own:

```tsx
import { AnimatedDialog } from 'loomshift-example';
import { AnimatedStack } from 'loomshift-example/stack';
import { ConfirmActions } from 'loomshift-example/confirm-actions';

<AnimatedDialog open={open} onClose={close} aria-labelledby="publish-title">
  <AnimatedStack direction="column" spacing={1}>
    <DialogTitle id="publish-title">Publish release?</DialogTitle>
    <DialogContent>
      <DialogContentText>This pushes the current build to production.</DialogContentText>
    </DialogContent>
    <DialogActions>
      <ConfirmActions confirmLabel="Publish" onOk={publish} onCancel={close} />
    </DialogActions>
  </AnimatedStack>
</AnimatedDialog>;
```

Nothing about the dialog changes: `open`, labelling and focus trapping still come
from `AnimatedDialog`, and both components read `prefers-reduced-motion` — or
their own `duration={0}` — so the pair collapses to an instant, motion-free
dialog with the gradient resting as a static wash.

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
    <ConfirmActions
      confirmLabel="Delete"
      destructive
      onOk={destroy}
      onCancel={close}
      okButtonProps={{ autoFocus: true }}
    />
  </DialogActions>
</AnimatedDialog>
```

`autoFocus` on the confirm button is what puts focus on it as the dialog opens;
handing focus back to the element that opened the dialog is MUI's focus trap, so
Esc, Cancel and Ok all end up back on the trigger without any extra work.

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

Anyone with `prefers-reduced-motion: reduce` — or a `duration={0}` — gets the
press without the motion: the button shades instantly while it is held down and
returns to its own colour on release, so the press is still acknowledged without
anything moving. Labels, callbacks and every other behaviour are identical.
`pressVariant="none"` is the full opt-out, leaving MUI's own ripple as the only
feedback.

Remaining props are forwarded to the underlying MUI `Stack`, so `sx` and
`spacing` work as usual.

### `AnimatedStack`

A MUI `Stack` that animates itself in as it mounts, published under its own
subpath export. It is a layout component first: every `Stack` prop
(`direction`, `spacing`, `alignItems`, `justifyContent`, `divider`, `sx`, …) is
forwarded untouched and arbitrary children render as its **direct flex items**,
so wrapping an existing layout changes when it appears, never how it is
arranged:

```tsx
import { AnimatedStack } from 'loomshift-example/stack';
import { ConfirmActions } from 'loomshift-example/confirm-actions';

function Example({ close }: { close: () => void }) {
  return (
    <AnimatedStack direction="column" spacing={2} variant="slide-up">
      <Typography variant="h6">Delete project?</Typography>
      <ConfirmActions confirmLabel="Delete" destructive onOk={destroy} onCancel={close} />
    </AnimatedStack>
  );
}
```

The animation only ever touches `opacity`, `scale` and `y` — never a layout
property — and the stack adds no width or `overflow` of its own, so the same
markup fits containers from 320px to 1440px without clipping. Animation is
configured through the same optional, fully typed props as the rest of the
library:

| Prop               | Type                                             | Default       |
| ------------------ | ------------------------------------------------ | ------------- |
| `variant`          | `'fade' \| 'grow' \| 'slide-up' \| 'slide-down'` | `'fade'`      |
| `background`       | `'gradient' \| 'none'`                           | `'gradient'`  |
| `duration`         | `number` (milliseconds)                          | `250`         |
| `easing`           | Framer Motion easing                             | `'easeInOut'` |
| `gradientColors`   | `string[]` (2+ CSS colours)                      | theme colours |
| `gradientAngle`    | `string` (`linear-gradient` angle/direction)     | `'120deg'`    |
| `gradientDuration` | `number` (milliseconds)                          | `12000`       |

`'fade'` is the default because it moves nothing, so dropping the component
around an existing layout cannot shift it. The prop surface is exactly `Stack`'s
plus these seven, so an unknown prop is a TypeScript error.

The animation plays once per mount. Remount the stack — a changing `key` is the
usual way — to play it again.

#### The gradient background

The stack paints its own surface by default, so a panel looks finished with no
props beyond its children:

```tsx
<AnimatedStack>{children}</AnimatedStack>
```

It is a `linear-gradient` built from the theme's `primary` and `secondary`
colours, tinted to 8% over `background.paper` and panned by a Framer Motion
animation of its own — 12 seconds per sweep, alongside (not instead of) the
enter animation. The pan ends on the frame it started from, so the loop repeats
without a seam, and the tints are faint enough that every text style the theme
pairs with `background.paper` stays above the WCAG AA contrast ratio at every
frame, in light and dark theme alike.

`sx` composes over the surface rather than being replaced by it, so a stack that
is given its own colour keeps it. `background="none"` is the full opt-out — the
transparent stack, with nothing painted behind the children:

```tsx
<AnimatedStack background="none">{children}</AnimatedStack>
```

Reduced motion — and `duration={0}` — stops the pan but keeps the surface: the
gradient is colour rather than movement, so it rests on one frame instead of
disappearing.

`gradientColors`, `gradientAngle` and `gradientDuration` override the gradient
without touching the enter animation, so a panel can match a feature's
branding:

```tsx
<AnimatedStack gradientColors={['#4F46E5', '#EC4899']}>{children}</AnimatedStack>
```

Each is independently optional — an unset one falls back to its theme default —
and `gradientColors` still needs 2 or more colours the browser can parse; too
few, or one it can't parse, falls back to the theme pair rather than rendering
a broken background. Override colours are tinted to the same 8% as the theme
default, but the WCAG AA contrast guarantee is only proven for the theme
palette: pick brand colours with enough contrast against `background.paper`
that text on top of them stays legible.

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
