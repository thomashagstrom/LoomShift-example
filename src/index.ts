export const name = 'loomshift-example';

/**
 * Placeholder export so the initial scaffold has a public surface to build,
 * type-check and publish. Real components live alongside this entry point.
 */
export function version(): string {
  return '0.0.0';
}

export { AnimatedDialog, default as AnimatedDialogDefault } from './AnimatedDialog';
export type {
  AnimatedDialogProps,
  AnimatedDialogVariant,
  AnimatedDialogEasing,
  AnimatedDialogCloseReason,
} from './AnimatedDialog';
