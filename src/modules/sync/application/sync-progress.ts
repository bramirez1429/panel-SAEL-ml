import type { MirrorWriteResult, SyncJob } from "../domain/sync.model";

export const MIRROR_SYNC_WARNING =
  "Mercado Libre fue actualizado, pero la copia local quedó pendiente de sincronización.";

export function calculateSyncPercent(
  processedItems: number,
  totalItems: number,
): number {
  if (totalItems <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((processedItems / totalItems) * 100)));
}

export function getDisplayedSync(overview: Readonly<{
  activeSync: SyncJob | null;
  latestSync: SyncJob | null;
}>): SyncJob | null {
  return overview.activeSync ?? overview.latestSync;
}

export function getMirrorSyncWarning(result: MirrorWriteResult): string | null {
  return result.providerUpdated && !result.mirrorUpdated
    ? result.warning || MIRROR_SYNC_WARNING
    : null;
}
