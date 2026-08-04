# Components

An overview of what's available in LoomShift-example, written for anyone
deciding whether a component fits their product — no code required.

## AnimatedDialog

A modal dialog for confirmations, forms, or any content that needs the user's
full attention. It looks and behaves exactly like a standard dialog, but
smoothly animates in and out instead of appearing abruptly, giving the
interface a more polished, considered feel. Default appearance zooms gently
into view.

## AnimatedSnackbar

A brief, non-blocking message that appears at the edge of the screen —
useful for confirmations like "Changes saved" or "Item added to cart". It
slides in from the bottom by default, drawing attention without interrupting
what the user is doing, then disappears on its own after a short delay.

## Shared behaviour

Both components share the same animation building blocks, so they feel
consistent wherever they're used:

- **Variants** — a small set of alternative entrance/exit styles (fade, zoom,
  slide) to match different contexts.
- **Adjustable speed** — the animation can be sped up, slowed down, or turned
  off entirely.
- **Respects user preferences** — anyone with reduced-motion settings enabled
  automatically gets an instant transition instead of an animated one.

See the [Usage guide](usage.md) for install instructions and code examples,
or browse the interactive [Storybook](https://storybook.js.org/) docs
(`npm run storybook`) to try each component live.
