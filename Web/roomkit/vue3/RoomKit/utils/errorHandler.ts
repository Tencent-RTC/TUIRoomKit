/**
 * Common RoomKit error codes shared across all features.
 * Maps error code → i18n key.
 */
const COMMON_ERROR_CODE_MAP: Record<number, string> = {
  100001: 'RoomError.100001',
  100002: 'RoomError.100002',
  100004: 'RoomError.100004',
  100006: 'RoomError.100006',
};

export interface RoomErrorOptions {
  /** Feature-specific error code overrides. Takes priority over common codes. */
  featureErrors?: Record<number, string>;
  /** Feature-level fallback key when no code match is found (e.g. 'CloudRecording.StartError'). */
  fallback?: string;
}

/**
 * Resolves the most specific i18n key for a RoomKit error.
 *
 * Resolution order:
 *  1. featureErrors[code]  — feature-specific message
 *  2. COMMON_ERROR_CODE_MAP[code] — shared error message
 *  3. options.fallback     — feature-level generic message
 *  4. 'RoomError.common'   — universal fallback
 */
export function getRoomErrorKey(error: unknown, options?: RoomErrorOptions): string {
  const code = (error as any)?.code;

  if (typeof code === 'number') {
    const featureKey = options?.featureErrors?.[code];
    if (featureKey) {
      return featureKey;
    }

    const commonKey = COMMON_ERROR_CODE_MAP[code];
    if (commonKey) {
      return commonKey;
    }
  }

  return options?.fallback ?? 'RoomError.common';
}
