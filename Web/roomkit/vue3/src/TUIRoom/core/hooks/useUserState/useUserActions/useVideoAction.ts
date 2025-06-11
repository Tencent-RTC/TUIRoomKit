import { computed, reactive, Ref, ref, markRaw } from 'vue';
import {
  TUIMediaDevice,
  TUIRequestCallbackType,
  TUIErrorCode,
  TUIRequest,
} from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { MESSAGE_DURATION } from '../../../../constants/message';
import useGetRoomEngine from '../../../../hooks/useRoomEngine';
import { useI18n } from '../../../../locales';
import { IconVideoOpen } from '@tencentcloud/uikit-base-component-vue3';
import { UserInfo, UserAction } from '../../../type';

const invitingUserOpenVideoRequestObj: Ref<Record<string, TUIRequest>> = ref(
  {}
);

export default function useVideoAction(userInfo: UserInfo) {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();
  async function muteUserVideo() {
    if (userInfo.hasVideoStream) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
      });
    } else {
      const isRequestingUserOpenCamera =
        invitingUserOpenVideoRequestObj.value[userInfo.userId];
      if (isRequestingUserOpenCamera) {
        TUIToast({
          type: TOAST_TYPE.INFO,
          message: `${t('An invitation to open the camera has been sent to sb.', { name: userInfo.displayName })}`,
          duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      const request = await roomEngine.instance?.openRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
        timeout: 0,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          code: TUIErrorCode;
        }) => {
          delete invitingUserOpenVideoRequestObj.value[userInfo.userId];
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
        message: `${t('An invitation to open the camera has been sent to sb.', { name: userInfo.displayName })}`,
        duration: MESSAGE_DURATION.NORMAL,
      });
      if (request && request.requestId) {
        invitingUserOpenVideoRequestObj.value[userInfo.userId] = request;
      }
    }
  }
  const videoControl = reactive({
    key: UserAction.VideoAction,
    icon: markRaw(IconVideoOpen),
    label: computed(() =>
      userInfo.hasVideoStream ? t('Disable video') : t('Enable video')
    ),
    handler: muteUserVideo,
  });
  return videoControl;
}
