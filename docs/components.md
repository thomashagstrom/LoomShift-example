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

## ConfirmActions

The pair of "Ok" and "Cancel" buttons that ends a confirmation. Any screen can
drop it in — a dialog, a form footer, an inline panel — and get the same
wording, order and styling every time, instead of each screen hand-rolling its
own pair. The labels can be changed ("Save"/"Discard", "Delete"/"Cancel"), and
it shows a spinner while the action is still finishing — during which the "Ok"
button stops accepting clicks, so a slow confirm can't be submitted twice by an
impatient user, while "Cancel" stays available.

**Use it when:** a screen asks the user to confirm or back out of something and
you want that choice to look and behave the same everywhere in the product.

## Shared behaviour

Every component in this library keeps all the accessibility behaviour (screen
reader support, keyboard focus order) of the standard MUI components it is
built from.

The animated components — `AnimatedDialog` and `AnimatedSnackbar` — also:

- Respect users' "reduce motion" accessibility setting by skipping the
  animation for people who need it.
- Can have their animation turned off entirely if a project doesn't want any
  motion.

This means adopting an animated component is a safe, low-risk swap — nothing
about how the component is used or who can use it changes, only how it
enters and exits the screen.
