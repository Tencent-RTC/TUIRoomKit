import TUIRoomResponse from './base/TUIRoomResponse';
import TUIRoomError from './base/TUIRoomError';
import TUIRoomInfo from './base/TUIRoomInfo';
import TUIRoomUser from './base/TUIRoomUser';
import TUIRoomCore from './TUIRoomCore';

export { TUIRoomResponse, TUIRoomError, TUIRoomInfo, TUIRoomUser, TUIRoomCore };

export default TUIRoomCore.getInstance();

(window as any).roomcore = TUIRoomCore.getInstance();

export {
  ETUIRoomRole,
  ETUIStreamType,
  ETUIRoomEvents,
  ETUISignalStatus,
  ETUISpeechMode,
  ETUIRoomMuteType
} from './types.d';

export * from './trtc_define';
