import { watch } from 'vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {  useRoomStore } from '../../../stores/room';
import  { TUIChangeReason,  TUIUserInfo } from '@tencentcloud/tuiroom-engine-wx';
import TUIMessage from '../../common/base/Message/index';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { MESSAGE_DURATION } from '../../../constants/message';
import { storeToRefs } from 'pinia';
import { isMobile, isWeChat } from '../../../utils/environment';
import logger from '../../../utils/common/logger';
import { SMALL_VIDEO_ENC_PARAM } from '../../../constants/room';

const logPrefix = '[StreamContainer]';

export default function useStreamContainer() {
  /**
   * --- The following processing stream events ----
   *
   * --- 以下处理流事件 ----
   **/
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { t } = useI18n();

  // 远端用户进入
  const onRemoteUserEnterRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
    roomStore.addRemoteUser(eventInfo.userInfo);
  };

  // 远端用户离开
  const onRemoteUserLeaveRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
    roomStore.removeRemoteUser(eventInfo.userInfo.userId);
  };

  // 麦位变化
  const onSeatListChanged = (eventInfo: { seatList: any[], seatedList: any[], leftList: any[] }) => {
    const { seatedList, leftList } = eventInfo;
    roomStore.updateOnSeatList(seatedList, leftList);
  };

  // 用户音频状态发生改变
  const onUserAudioStateChanged = (eventInfo: {
    userId: string,
    hasAudio: boolean,
    reason: TUIChangeReason,
  }) => {
    const { userId, hasAudio, reason } = eventInfo;
    roomStore.updateUserAudioState(userId, hasAudio);
    // 处理状态变更
    if (userId === basicStore.userId && !hasAudio && reason === TUIChangeReason.kChangedByAdmin) {
      // 主持人关闭麦克风
      TUIMessage({
        type: 'warning',
        message: t('Your microphone has been turned off'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      /**
       * When the host turns on a full ban, the microphone of a single person is turned on
       * and off separately, and the microphone status of the corresponding user is inoperable at this time
       *
       * 主持人开启全员禁言时，单独打开再关闭单人的麦克风，此时对应用户的麦克风状态为无法操作
       **/
      roomStore.setCanControlSelfAudio(!roomStore.isMicrophoneDisableForAllUser);
    }
  };
  const {
    isDefaultOpenCamera,
    isDefaultOpenMicrophone,
    isLocalAudioIconDisable,
    isLocalVideoIconDisable,
  } = storeToRefs(roomStore);

  watch(isDefaultOpenCamera, async (val) => {
    if (val && !isLocalVideoIconDisable.value) {
      /**
       * Turn on the local camera
       *
       * 开启本地摄像头
       **/

      if (isWeChat) {
        await roomEngine.instance?.setLocalVideoView({
          view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
        });
        // @ts-ignore
        await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
      } else if (isMobile) {
        const previewDom = document?.getElementById(`${roomStore.localStream.userId}_${roomStore.localStream.streamType}`);
        if (!previewDom) {
          logger.error(`${logPrefix}watch isDefaultOpenCamera:`, isDefaultOpenCamera, previewDom);
          return;
        }
        await roomEngine.instance?.setLocalVideoView({
          view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
        });
        const trtcCloud = roomEngine.instance?.getTRTCCloud();
        trtcCloud?.enableSmallVideoStream(false, SMALL_VIDEO_ENC_PARAM);
        // @ts-ignore
        await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
        return;
      } else {
        const previewDom = document?.getElementById(`${roomStore.localStream.userId}_${roomStore.localStream.streamType}`);
        if (!previewDom) {
          logger.error(`${logPrefix}watch isDefaultOpenCamera:`, isDefaultOpenCamera, previewDom);
          return;
        }
        /**
         * Set device id
         *
         * 设置设备id
        **/
        if (!roomStore.currentCameraId) {
          const cameraList = await roomEngine.instance?.getCameraDevicesList();
          if (cameraList && cameraList.length > 0) {
            roomStore.setCurrentCameraId(cameraList[0].deviceId);
          }
        }
        await roomEngine.instance?.setCurrentCameraDevice({ deviceId: roomStore.currentCameraId });
        /**
         * Turn on the local camera
         *
         * 开启本地摄像头
        **/
        await roomEngine.instance?.setLocalVideoView({
          view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
        });
        await roomEngine.instance?.openLocalCamera();
      }
    }
  });

  watch(isDefaultOpenMicrophone, async (val) => {
    if (val && !isLocalAudioIconDisable.value) {
      /**
       * Advance the timing of startMicrophone to ensure that it is executed before startCameraPreview
       *
       * 提前 startMicrophone 的时机，保证在 startCameraPreview 之前执行
       **/
      await roomEngine.instance?.unmuteLocalAudio();
      if (!basicStore.isOpenMic) {
        roomEngine.instance?.openLocalMicrophone();
        basicStore.setIsOpenMic(true);
      }
      if (!isWeChat && !isMobile) {
        const microphoneList = await roomEngine.instance?.getMicDevicesList();
        const speakerList = await roomEngine.instance?.getSpeakerDevicesList();
        if (microphoneList?.length === 0 || speakerList?.length === 0) return;
        if (!roomStore.currentMicrophoneId && microphoneList.length > 0) {
          roomStore.setCurrentMicrophoneId(microphoneList[0].deviceId);
        }
        if (!roomStore.currentSpeakerId && speakerList.length > 0) {
          roomStore.setCurrentSpeakerId(speakerList[0].deviceId);
        }
        await roomEngine.instance?.setCurrentMicDevice({ deviceId: roomStore.currentMicrophoneId });
      }
    } else {
      await roomEngine.instance?.muteLocalAudio();
    }
  });
  return {
    onRemoteUserEnterRoom,
    onRemoteUserLeaveRoom,
    onSeatListChanged,
    onUserAudioStateChanged,
    t,
  };
}
