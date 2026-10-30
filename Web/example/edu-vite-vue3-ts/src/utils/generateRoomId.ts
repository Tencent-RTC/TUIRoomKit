const ROOM_ID_ATTEMPTS = 5;
const ROOM_ID_NOT_EXIST = 100004;
const SDK_NOT_INITIALIZED = -1002;

function errorCode(error: unknown): unknown {
  return error && typeof error === 'object' && 'code' in error ? error.code : undefined;
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return '';
}

function isEngineNotReady(error: unknown): boolean {
  return errorCode(error) === SDK_NOT_INITIALIZED || errorText(error).includes('not inited');
}

export async function generateRoomId(
  getRoomInfo: (roomId: string) => Promise<unknown>,
): Promise<string | undefined> {
  for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
    const roomId = String(Math.floor(100000 + Math.random() * 900000));
    try {
      // eslint-disable-next-line no-await-in-loop
      const info = await getRoomInfo(roomId);
      if (info == null) {
        return roomId;
      }
    } catch (error) {
      if (isEngineNotReady(error) || errorCode(error) === ROOM_ID_NOT_EXIST) {
        return roomId;
      }
      return undefined;
    }
  }
  return undefined;
}
