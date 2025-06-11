import { reactive, markRaw } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { useRoomStore } from '../../../../stores/room';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import { IconTransferOwner } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../../../components/common/base/MessageBox';
import eventBus from '../../../../hooks/useMitt';
import { UserInfo, UserAction } from '../../../type';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();
export default function useTransferOwnerAction(userInfo: UserInfo) {
  const roomStore = useRoomStore();

  function transferOwnerFunc() {
    TUIMessageBox({
      title: t('Transfer the roomOwner to sb', {
        name: userInfo.displayName,
      }),
      message: t(
        'After transfer the room owner, you will become a general user'
      ),
      confirmButtonText: t('Confirm transfer'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          handleTransferOwner();
        }
      },
    });
  }

  /**
   * Transfer host to user
   */
  async function handleTransferOwner() {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    if (roomInfo?.roomOwner === roomStore.localUser.userId) {
      try {
        if (
          roomStore.localUser.hasScreenStream &&
          roomStore.isScreenShareDisableForAllUser
        ) {
          eventBus.emit('ScreenShare:stopScreenShare');
        }
        await roomEngine.instance?.changeUserRole({
          userId: userInfo.userId,
          userRole: TUIRole.kRoomOwner,
        });
        roomStore.setMasterUserId(userInfo.userId);
        TUIToast({
          type: TOAST_TYPE.SUCCESS,
          message: t('The room owner has been transferred to sb', {
            name: userInfo.displayName,
          }),
          duration: MESSAGE_DURATION.NORMAL,
        });
      } catch (error) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('Make host failed, please try again.'),
          duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  const transferOwner = reactive({
    key: UserAction.TransferOwnerAction,
    icon: markRaw(IconTransferOwner),
    label: t('Make host'),
    handler: transferOwnerFunc,
  });
  return transferOwner;
}
