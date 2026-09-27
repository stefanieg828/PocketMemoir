/**
 * Resolve `tourSeen` during zustand persist merge.
 *
 * Brand-new browser (no persisted object): keep current (false) so the tour shows.
 * Explicit boolean in save: use it.
 * Pre-tour legacy save (object with shelf/settings but no tourSeen): treat as seen
 * so we don't re-nag existing users. Empty `{}` is not legacy.
 *
 * When `alreadyHydrated` is true, keep the live value. That guards a race where
 * hasHydrated flipped early, the user skipped/finished (or reset via Look), then a
 * late rehydrate merge applied a stale storage read and clobbered tourSeen.
 */
export function resolveTourSeen(
  persisted: unknown,
  currentTourSeen: boolean,
  alreadyHydrated = false,
): boolean {
  if (alreadyHydrated) return currentTourSeen;

  const incoming = (persisted ?? {}) as {
    tourSeen?: unknown;
    entries?: unknown;
    mode?: unknown;
    look?: unknown;
    jacket?: unknown;
  };

  if (typeof incoming.tourSeen === "boolean") return incoming.tourSeen;
  if (persisted == null || typeof persisted !== "object") return currentTourSeen;

  const legacy =
    Array.isArray(incoming.entries) ||
    incoming.mode != null ||
    incoming.look != null ||
    incoming.jacket != null;
  return legacy ? true : currentTourSeen;
}
