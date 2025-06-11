import { reactive, h, render, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../../constants/message';
import useGetRoomEngine from '../../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../../locales';
import { IconEditNameCard } from '@tencentcloud/uikit-base-component-vue3';
import ChangeNameCardDialog from './changeNameCardDialog.vue';
import changeNameCardInput from './changeNameCardInput.vue';
import { calculateByteLength } from '../../../../../utils/utils';
import { UserAction, UserInfo } from '../../../../type';
import { isMobile } from '../../../../../utils/environment';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();
export default function useNameCardAction(userInfo: UserInfo) {
  const nameCardCheck = (inputUserName: string) => {
    const result = calculateByteLength(inputUserName) <= 32;
    !result &&
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('The user name cannot exceed 32 characters'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    return result;
  };

  async function handleChangeUserNameCard(inputUserName: string) {
    if (!nameCardCheck(inputUserName)) {
      return Promise.reject('The user name cannot exceed 32 characters');
    }
    try {
      await roomEngine.instance?.changeUserNameCard({
        userId: userInfo.userId,
        nameCard: inputUserName,
      });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('Name changed successfully'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    } catch (error) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('change name failed, please try again.'),
        duration: 5000,
      });
    }
  }

  function renderChangeNameCardDialog() {
    const Component = isMobile ? changeNameCardInput : ChangeNameCardDialog;
    const vNode = h(Component, {
      userInfo,
      confirmFunction: handleChangeUserNameCard,
    });
    const div = document.createElement('div');
    render(vNode, div);
    document.getElementById('roomContainer')?.appendChild(div.childNodes[0]);
  }

  const changeUserNameCard = reactive({
    key: UserAction.ChangeUserNameCardAction,
    icon: markRaw(IconEditNameCard),
    label: t('change name'),
    handler: renderChangeNameCardDialog,
  });
  return changeUserNameCard;
}
