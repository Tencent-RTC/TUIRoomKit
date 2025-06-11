import { computed, reactive, Ref, ref } from 'vue';
import {
  TUIMediaDevice,
  TUIRequestCallbackType,
  TUIErrorCode,
  TUIRequest,
} from '@tencentcloud/tuiroom-engine-js';
import { MESSAGE_DURATION } from '../../../../constants/message';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import { UserInfo, UserAction, ActionType } from '../../../type';
import {
  IconVideoOpen,
  IconAudioOpen,
  TUIToast,
  TOAST_TYPE
} from '@tencentcloud/uikit-base-component-vue3';

const invitingUserOpenAudioRequestObj: Ref<Record<string, TUIRequest>> = ref(
  {}
);

export default function useAudioControl(
  userInfo: UserInfo
): ActionType<UserAction> {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  async function muteUserAudio() {
    if (userInfo.hasAudioStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
      });
    } else {
      const isRequestingUserOpenMic =
        invitingUserOpenAudioRequestObj.value[userInfo.userId];
      if (isRequestingUserOpenMic) {
        TUIToast({
          type: TOAST_TYPE.INFO,
          message: `${t('An invitation to open the microphone has been sent to sb.', { name: userInfo.displayName })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
        timeout: 0,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          code: TUIErrorCode;
        }) => {
          delete invitingUserOpenAudioRequestObj.value[userInfo.userId];
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIToast({
                  type: TOAST_TYPE.WARNING,
                  message: t(
                    'This member has already received the same request, please try again later'
                  ),
                  duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
          }
        },
      });
      TUIToast({
        type: TOAST_TYPE.INFO,
        message: `${t('An invitation to open the microphone has been sent to sb.', { name: userInfo.displayName })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        invitingUserOpenAudioRequestObj.value[userInfo.userId] = request;
      }
    }
  }

  const audioControl = reactive({
    key: UserAction.AudioAction,
    icon: computed(() =>
      userInfo.hasAudioStream ? IconAudioOpen : IconVideoOpen
    ),
    label: computed(() => (userInfo.hasAudioStream ? t('Mute') : t('Unmute'))),
    handler: muteUserAudio,
  });
  return audioControl;
}
