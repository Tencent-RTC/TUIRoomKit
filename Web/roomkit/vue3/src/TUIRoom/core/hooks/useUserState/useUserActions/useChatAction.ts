import { computed, reactive, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE, IconChatForbidden } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import { UserInfo, UserAction, ActionType } from '../../../type';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();
export default function useChatAction(
  userInfo: UserInfo
): ActionType<UserAction> {
  async function disableUserChat() {
    const { isMessageDisabled } = userInfo;
    try {
      await roomEngine.instance?.disableSendingMessageByAdmin({
        userId: userInfo.userId,
        isDisable: !isMessageDisabled,
      });
    } catch (error) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('Failed to disable chat'),
        duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  const chatControl = reactive({
    key: UserAction.ChatAction,
    icon: markRaw(IconChatForbidden),
    label: computed(() =>
      userInfo.isMessageDisabled ? t('Enable chat') : t('Disable chat')
    ),
    handler: disableUserChat,
  });

  return chatControl;
}
