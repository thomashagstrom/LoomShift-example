# Components

A plain-language look at what's in the library and when to reach for each
piece. For code samples and props, see [usage.md](./usage.md).

## AnimatedDialog

A modal dialog — the kind of pop-up window used to confirm an action, show a
form, or display extra details — that smoothly animates in and out instead of
appearing abruptly. It looks and behaves exactly like a standard dialog, so
designers and users get the same familiar experience, just with a more
polished feel.

**Use it when:** you already use dialogs/modals and want them to feel less
jarring, without changing how they're triggered or what's inside them.

## AnimatedSnackbar

A small notification banner ("snackbar" or "toast") that slides or fades in
to confirm something happened — like "Changes saved" — and disappears again
on its own. It's a drop-in upgrade for existing notification banners, adding
motion so the message feels noticed rather than just appearing and vanishing.

**Use it when:** you want short-lived confirmations or status messages to
feel more alive and easier to notice.

## Shared behaviour

Every component in this library:

- Respects users' "reduce motion" accessibility setting by skipping the
  animation for people who need it.
- Can have its animation turned off entirely if a project doesn't want any
  motion.
- Keeps all the accessibility behaviour (screen reader support, keyboard
  focus) of the standard component it replaces.

This means adopting an animated component is a safe, low-risk swap — nothing
about how the component is used or who can use it changes, only how it
enters and exits the screen.
