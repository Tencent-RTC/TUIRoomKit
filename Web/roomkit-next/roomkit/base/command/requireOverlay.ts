import { getActiveOverlayContext } from '../overlayRegistry';
import type { OverlayContext } from '../tokens';

export function requireOverlayContext(apiName: string): OverlayContext | null {
  const ctx = getActiveOverlayContext();
  if (!ctx) {
    console.warn(`[RoomKit] ${apiName} requires a mounted RoomKitProvider. Call ignored.`);
    return null;
  }
  return ctx;
}
