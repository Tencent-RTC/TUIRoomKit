import { reactive, markRaw } from 'vue';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import TUIMessageBox from '../../../../components/common/base/MessageBox';
import { UserInfo, UserAction } from '../../../type';
import { IconKickOut } from '@tencentcloud/uikit-base-component-vue3';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();

export default function useKickUserAction(userInfo: UserInfo) {
  async function kickUserFunc() {
    TUIMessageBox({
      title: t('Note'),
      message: t('whether to kick sb off the room', {
        name: userInfo.displayName,
      }),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          await roomEngine.instance?.kickRemoteUserOutOfRoom({
            userId: userInfo.userId,
          });
        }
      },
    });
  }
  const kickUser = reactive({
    key: UserAction.KickOutOfRoomAction,
    icon: markRaw(IconKickOut),
    label: t('Kick out'),
    handler: kickUserFunc,
  });
  return kickUser;
}
