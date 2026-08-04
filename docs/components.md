# Components

A plain-language tour of everything the library ships, written for anyone
deciding *whether* to use a component rather than *how* to wire it up. For code
examples and prop tables, see [Usage](./usage.md).

The library is a set of **animated, drop-in replacements for MUI components**.
Each one looks and behaves exactly like the MUI component it replaces — the same
appearance, the same keyboard and screen-reader support — but it appears and
disappears with a smooth motion instead of popping into place.

| Component          | Replaces         | What it's for                                    | How it moves by default |
| ------------------ | ---------------- | ------------------------------------------------ | ----------------------- |
| `AnimatedDialog`   | MUI `Dialog`     | Focused tasks and decisions in a modal window    | Zooms in gently         |
| `AnimatedSnackbar` | MUI `Snackbar`   | Brief confirmations and notices at the edge      | Slides up from below    |

## AnimatedDialog

A modal window that takes over the screen so someone can complete one thing at a
time — confirming a deletion, filling in a short form, reading a message that
must be acknowledged.

Instead of appearing instantly, it scales and fades into view, which makes the
jump from the page to the dialog feel like a step rather than a flash. Closing
reverses the same motion, so it is clear the dialog is going away rather than the
page changing underneath.

While it is open the rest of the page is dimmed, keyboard focus is kept inside
the dialog, and assistive technology announces it as a dialog. That behaviour is
inherited from MUI unchanged, so nothing about accessibility or interaction is
traded for the animation.

**Reach for it when** you would already reach for a modal: a decision to confirm,
a small amount of content to focus on, or a task that should interrupt.

## AnimatedSnackbar

A small message that appears at the edge of the screen to confirm something
happened — "Changes saved", "Message sent", "Couldn't connect" — and then gets
out of the way, either on its own after a few seconds or when dismissed.

It slides in from the edge it is anchored to, which reads as a message arriving
rather than a piece of the page suddenly existing. It never blocks the page, so
people can keep working while it is on screen.

It is packaged as a self-contained slice of the library, so a product that only
needs notifications ships only the notification code.

**Reach for it when** you need to acknowledge an action without interrupting it.
If the message needs a decision or must not be missed, use `AnimatedDialog`
instead.

## What every component shares

- **Consistent motion.** All components animate over the same quarter-second
  with the same easing, so different parts of a product feel like one product.
- **Choice of movement.** Each component offers a handful of ready-made motions
  (fading, zooming, growing, sliding up or down) picked with a single setting;
  timing and pacing can be tuned to match an existing design language.
- **Motion can be turned off.** The animation can be disabled per component
  without changing anything else about how it works.
- **Respects the user's preference automatically.** Anyone whose device is set to
  reduce motion — a common accessibility and motion-sickness setting — gets an
  instant transition with no extra work from the team.
- **No lock-in.** Because each component is the MUI component underneath,
  swapping it in (or back out) is a change to one import line.

## Trying them out

The [interactive docs site](../README.md#interactive-docs-site) renders every component
live, with controls for the motion settings, so you can see each option in a
browser before committing to it.
