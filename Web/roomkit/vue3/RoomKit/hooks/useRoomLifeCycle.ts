import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIToast,
  TUIMessageBox,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomModal } from 'tuikit-atomicx-vue3/room';
import { ref } from 'vue';
import { eventCenter } from '../utils/eventCenter';
import { RoomEvent } from '../adapter/type';

const isJoiningRoom = ref(false);
const joiningRoomId = ref('');
const roomPasswordVisible = ref(false);
const { t } = useUIKit();

const { handleErrorWithModal } = useRoomModal();

const handleJoinRoomError = (error: any) => {
  let errorMessage = '';
  let useAlert = false;
  handleErrorWithModal(error);

  switch (error.code) {
    case TUIErrorCode.ERR_NEED_PASSWORD:
      roomPasswordVisible.value = true;
      return;
    case TUIErrorCode.ERR_WRONG_PASSWORD:
      TUIToast.error({ message: t('Room.InvalidPassword') });
      return;
    case TUIErrorCode.ERR_ROOM_ID_NOT_EXIST:
      errorMessage = t('Room.RoomNotFound');
      useAlert = true;
      break;
    case TUIErrorCode.ERR_ROOM_USER_FULL:
      errorMessage = t('Room.RoomFull');
      useAlert = true;
      break;
    case TUIErrorCode.ERR_ROOM_ID_OCCUPIED:
      errorMessage = t('Room.RoomOccupied');
      useAlert = true;
      break;
    default:
      errorMessage = t('Room.JoinRoomError');
      console.error('Join room error:', error);
      eventCenter.emit(RoomEvent.ROOM_ERROR, error);
  }

  if (!errorMessage) {
    return;
  }

  if (useAlert) {
    TUIMessageBox.alert({
      type: 'error',
      modal: false,
      showClose: false,
      title: t('Room.Alert'),
      content: errorMessage,
      onConfirm: () => {
        eventCenter.emit(RoomEvent.ROOM_ERROR, error);
      },
    });
  } else {
    TUIToast.error({ message: errorMessage });
  }
};

export default function useRoomLifeCycle() {
  return {
    isJoiningRoom,
    joiningRoomId,
    roomPasswordVisible,
    handleJoinRoomError,
  };
}
