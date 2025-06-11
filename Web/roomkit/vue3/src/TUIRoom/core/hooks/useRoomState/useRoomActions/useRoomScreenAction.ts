import { computed, reactive } from 'vue';
import { TUIRole, TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { IconAllMembersShareScreen, IconHostShareScreen } from '@tencentcloud/uikit-base-component-vue3';
import { ActionType, RoomAction } from '../../../type';
import { useI18n } from '../../../../locales';
import { useRoomStore } from '../../../../stores/room';
import TUIMessageBox from '../../../../components/common/base/MessageBox';
import useRoomEngine from '../../../../hooks/useRoomEngine';
import useUserState from '../../useUserState';

export default function useRoomScreenAction(): ActionType<RoomAction> {
  const { t } = useI18n();
  const roomStore = useRoomStore();
  const roomEngine = useRoomEngine();
  let stateForScreenShare = false;
  const { remoteUserList } = useUserState();

  const generalUserScreenStreamList = computed(() => {
    return remoteUserList.value.filter(
      item => item.hasScreenStream && item.userRole === TUIRole.kGeneralUser
    );
  });

  async function toggleAllScreenShare() {
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForScreenShare,
      device: TUIMediaDevice.kScreen,
    });
    roomStore.setDisableScreenShareForAllUserByAdmin(stateForScreenShare);
  }

  function toggleRoomScreen() {
    stateForScreenShare = !roomStore.isScreenShareDisableForAllUser;
    if (generalUserScreenStreamList.value.length === 0) {
      toggleAllScreenShare();
      return;
    }
    TUIMessageBox({
      title: t(
        'Is it turned on that only the host/admin can share the screen?'
      ),
      message: t(
        "Other member is sharing the screen is now, the member's sharing will be terminated after you turning on"
      ),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          await roomEngine.instance?.closeRemoteDeviceByAdmin({
            userId: generalUserScreenStreamList.value[0].userId,
            device: TUIMediaDevice.kScreen,
          });
          toggleAllScreenShare();
        }
      },
    });
  }

  const roomScreenAction = reactive({
    key: RoomAction.ScreenAction,
    label: computed(() =>
      roomStore.isScreenShareDisableForAllUser
        ? t('All members can share screen')
        : t('Screen sharing for host/admin only')
    ),
    icon: computed(() =>
      roomStore.isScreenShareDisableForAllUser
        ? IconAllMembersShareScreen
        : IconHostShareScreen
    ),
    handler: toggleRoomScreen,
  });

  return roomScreenAction;
}
