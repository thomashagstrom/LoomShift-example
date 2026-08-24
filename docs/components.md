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
impatient user, while "Cancel" stays available. Both buttons also give way
slightly as they're pressed, by mouse, finger or keyboard, so the choice feels
answered the instant it's made.

**Use it when:** a screen asks the user to confirm or back out of something and
you want that choice to look and behave the same everywhere in the product.

It is also published as **`OkCancelButtons`**, for teams who look for the pair
by that name. It is the very same component, not a second one, so there is only
ever one confirm/cancel pair to learn and to maintain.

## AnimatedStack

A layout box that arranges whatever you put inside it in a row or a column with
even gaps between the items — and eases itself onto the screen instead of
snapping into place. It is the standard MUI stack with nothing taken away, so
anything can go inside it: cards, form rows, the "Ok"/"Cancel" pair. The
arrangement is unchanged whether the animation runs or not, so it fits a phone
and a wide desktop the same way.

It also gives itself a background out of the box: a very faint colour wash,
taken from the product's own theme, that drifts slowly and never stops. It is
deliberately subtle — enough to make a panel look finished with no design work
at all, and far too light to make any text on it harder to read. It can be
turned off for stacks that should stay see-through.

**Use it when:** you need a simple row or column of items and want the group to
appear gracefully — for example a panel whose contents are revealed after
loading. It is also the tidiest way to lay out a dialog: put one inside an
`AnimatedDialog` and the heading, the message and the "Ok"/"Cancel" pair are
spaced evenly down the panel, on that same faint wash, without any styling work.

## Shared behaviour

Every component in this library keeps all the accessibility behaviour (screen
reader support, keyboard focus order) of the standard MUI components it is
built from.

The animated components — `AnimatedDialog`, `AnimatedSnackbar`, `AnimatedStack`
and the `ConfirmActions` press feedback — also:

- Respect users' "reduce motion" accessibility setting by skipping the
  animation for people who need it.
- Can have their animation turned off entirely if a project doesn't want any
  motion.

This means adopting an animated component is a safe, low-risk swap — nothing
about how the component is used or who can use it changes, only how it enters
and exits the screen and how it answers a press.
