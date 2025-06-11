import useRoomAudioAction from './useRoomAudioAction';
import useRoomVideoAction from './useRoomVideoAction';
import useRoomScreenAction from './useRoomScreenAction';
import { ActionType, RoomAction } from '../../../type';
export default function useRoomActions(options?: {
  actionList: RoomAction[];
}): ActionType<RoomAction>[] {
  const roomActionObj = {
    [RoomAction.AudioAction]: useRoomAudioAction(),
    [RoomAction.VideoAction]: useRoomVideoAction(),
    [RoomAction.ScreenAction]: useRoomScreenAction(),
  };

  if (options && options.actionList && options.actionList.length > 0) {
    return options.actionList.map(action => roomActionObj[action]);
  }
  return Object.values(roomActionObj);
}
