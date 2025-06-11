import { reactive, computed } from 'vue';
import { TUIMediaDevice, TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import { IconSetAdmin, IconRevokeAdmin } from '@tencentcloud/uikit-base-component-vue3';
import { UserInfo, UserAction, ActionType } from '../../../type';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();
export default function useAdminAction(
  userInfo: UserInfo
): ActionType<UserAction> {
  async function handleSetOrRevokeAdmin() {
    const newRole =
      userInfo.userRole === TUIRole.kGeneralUser
        ? TUIRole.kAdministrator
        : TUIRole.kGeneralUser;
    await roomEngine.instance?.changeUserRole({
      userId: userInfo.userId,
      userRole: newRole,
    });
    const tipMessage =
      newRole === TUIRole.kAdministrator
        ? `${t('sb has been set as administrator', { name: userInfo.displayName })}`
        : `${t('The administrator status of sb has been withdrawn', { name: userInfo.displayName })}`;
    TUIToast({ type: TOAST_TYPE.SUCCESS, message: tipMessage });
    if (newRole === TUIRole.kGeneralUser && userInfo.hasScreenStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kScreen,
      });
    }
  }
  // todo: 确认为什么要用 reactive，原因是 computed 在外面修改 label 的时候失去响应式
  const setOrRevokeAdmin = reactive({
    key: UserAction.AdministratorAction,
    icon: computed(() =>
      userInfo.userRole === TUIRole.kAdministrator
        ? IconRevokeAdmin
        : IconSetAdmin
    ),
    label: computed(() =>
      userInfo.userRole === TUIRole.kAdministrator
        ? t('Remove administrator')
        : t('Set as administrator')
    ),
    handler: handleSetOrRevokeAdmin,
  });
  return setOrRevokeAdmin;
}
