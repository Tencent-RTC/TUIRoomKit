import { TUIToast, activeScene, i18n } from '../base';

export interface RoomErrorRule {
  /** i18n key of the toast; scenes reword it in their own namespace. */
  key?: string;
  /** Toast level, `error` by default. */
  level?: 'error' | 'warning';
  /** Logged by the caller only; no toast. */
  silent?: boolean;
}

/**
 * How RoomKit surfaces each engine error code, shared by every feature and scene.
 * A new code is one row here plus its wording; callers stay unchanged.
 */
const COMMON_ERRORS: Record<number, RoomErrorRule> = {
  [-1]: { key: 'RoomError.Failure.Default' },
  [-2]: { key: 'RoomError.Failure.TooFrequent', level: 'warning' },
  [-1001]: { key: 'RoomError.Failure.InvalidParameter' },
  [-1002]: { key: 'RoomError.Failure.NotLoggedIn' },
  100001: { key: 'RoomError.Failure.Server' },
  100002: { key: 'RoomError.Failure.Default' },
  100004: { key: 'RoomError.Failure.RoomNotFound' },
  100006: { key: 'RoomError.Failure.NotAllowed' },
  100007: { key: 'RoomError.Failure.Package' },
  100012: { key: 'RoomError.Failure.TooFrequent', level: 'warning' },
  100020: { key: 'Participants.Failure.AdminLimit' },
  // The previous call is still running; the retry it blocked needs no notice.
  100100: { silent: true },
  101072: { key: 'RoomError.Failure.Package' },
};

const DEFAULT_ERROR_KEY = 'RoomError.Failure.Default';

export interface RoomErrorOptions {
  /** Feature-specific error code overrides. Takes priority over common codes. */
  featureErrors?: Record<number, string>;
  /** Feature-level fallback key when no code match is found. */
  fallback?: string;
}

function resolveRoomError(error: unknown, options?: RoomErrorOptions): RoomErrorRule {
  const code = (error as { code?: number } | undefined)?.code;
  if (typeof code === 'number') {
    const featureKey = options?.featureErrors?.[code];
    if (featureKey) {
      return { key: featureKey };
    }
    const commonRule = COMMON_ERRORS[code];
    if (commonRule) {
      return commonRule;
    }
  }
  return { key: options?.fallback ?? DEFAULT_ERROR_KEY };
}

/**
 * Resolves the most specific i18n key for a RoomKit error.
 *
 * Resolution order:
 *  1. featureErrors[code]  — feature-specific message
 *  2. COMMON_ERRORS[code]  — shared error message
 *  3. options.fallback     — feature-level generic message
 *  4. RoomError.Failure.Default — universal fallback
 */
export function getRoomErrorKey(error: unknown, options?: RoomErrorOptions): string {
  return resolveRoomError(error, options).key ?? options?.fallback ?? DEFAULT_ERROR_KEY;
}

/**
 * Toasts a failed engine call by its error code, in the active scene's wording.
 * Callers log the error themselves, so the code reaches the console with their context.
 */
export function toastRoomError(error: unknown, options: { fallback: string }): void {
  const rule = resolveRoomError(error, options);
  if (rule.silent || !rule.key) {
    return;
  }
  // Scene namespaces fall back to the base wording for keys they do not reword.
  const message = i18n.getFixedT(null, activeScene.value)(rule.key);
  if (rule.level === 'warning') {
    TUIToast.warning(message);
  } else {
    TUIToast.error(message);
  }
}
