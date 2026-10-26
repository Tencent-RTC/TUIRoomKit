import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import type { RoomEntryPhase } from './roomEntry';

export type PasswordChallenge = 'required' | 'incorrect';
export type RoomEntryFailureReason = 'login' | 'profile' | 'roomNotFound' | 'roomFull' | 'cleanup' | 'unknown';

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

export function getRoomEntryFailureReason(error: unknown, phase: RoomEntryPhase): RoomEntryFailureReason {
  if (error instanceof RoomCleanupError) {
    return 'cleanup';
  }
  if (phase === 'login' || phase === 'profile') {
    return phase;
  }
  const code = (error as { code?: number })?.code;
  if (code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
    return 'roomNotFound';
  }
  if (code === TUIErrorCode.ERR_ROOM_USER_FULL) {
    return 'roomFull';
  }
  return 'unknown';
}
