/**
 * Anything with a `then` is close enough: we only ever await the result.
 *
 * Shared so a component and the host composing it agree on what counts as an
 * async action — {@link ConfirmActions} uses it to decide when the confirm
 * button goes busy, {@link AnimatedDialog} to decide when to close.
 */
export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}
