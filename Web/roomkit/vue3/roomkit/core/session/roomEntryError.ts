import { TUIErrorCode } from 'tuikit-atomicx-vue3/room';
import { getRoomErrorKey } from '../../utils/roomError';
import type { RoomEntryPhase } from './roomEntry';

export type PasswordChallenge = 'required' | 'incorrect';

/** IM login error: the SDKAppID's daily active users exceed the current package limit. */
const DAU_LIMIT_EXCEEDED_CODE = 72000;

/** Preserve both the entry failure and the failed attempt to release SDK resources. */
export class RoomCleanupError extends AggregateError {
  constructor(error: unknown, cleanupError: unknown) {
    super([error, cleanupError], 'Room entry failed and its resources could not be released.', { cause: error });
    this.name = 'RoomCleanupError';
  }
}

export function getPasswordChallenge(error: unknown): PasswordChallenge | undefined {
  const code = (error as { code?: number })?.code;
  if (code === TUIErrorCode.ERR_NEED_PASSWORD) {
    return 'required';
  }
  if (code === TUIErrorCode.ERR_WRONG_PASSWORD) {
    return 'incorrect';
  }
  return undefined;
}

/**
 * i18n key of the entry-failure notice. Login and profile errors come from IM, whose
 * codes overlap the engine's, so only the joining phase resolves through roomError.
 */
export function getRoomEntryFailureKey(error: unknown, phase: RoomEntryPhase): string {
  if (error instanceof RoomCleanupError) {
    return 'RoomEntry.Failure.cleanup';
  }
  if (phase === 'login') {
    const code = (error as { code?: number })?.code;
    return code === DAU_LIMIT_EXCEEDED_CODE ? 'RoomEntry.Failure.dauLimitExceeded' : 'RoomEntry.Failure.login';
  }
  if (phase === 'profile') {
    return 'RoomEntry.Failure.profile';
  }
  return getRoomErrorKey(error, {
    featureErrors: { [TUIErrorCode.ERR_ROOM_USER_FULL]: 'RoomEntry.Failure.roomFull' },
  });
}
