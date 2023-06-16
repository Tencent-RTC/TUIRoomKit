import { watch } from 'vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {  useRoomStore } from '../../../stores/room';
import  { TUIChangeReason,  TUIUserInfo, TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { ElMessage } from '../../../elementComp';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { MESSAGE_DURATION } from '../../../constants/message';
import { storeToRefs } from 'pinia';
import isMobile from '../../../utils/useMediaValue';

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
    const { seatList, seatedList, leftList } = eventInfo;
    roomStore.updateOnSeatList(seatList, seatedList, leftList);
    // todo: 最大屏的用户离开时，应该换一个最大屏的用户
    // else if (userInfo.userId === enlargeStream.value?.userId) {
    //   [enlargeStream.value] = roomStore.remoteStreamList;
    // }
  };
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
      ElMessage({
        type: 'warning',
        message: t('The host has turned off your microphone'),
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
      const previewDom = document.getElementById(`${roomStore.localStream.userId}_${roomStore.localStream.streamType}`);
      if (previewDom) {
        /**
         * Set device id
         *
         * 设置设备id
        **/
        if (!roomStore.currentCameraId) {
          const cameraList = await roomEngine.instance?.getCameraDevicesList();
          roomStore.setCurrentCameraId(cameraList[0].deviceId);
        }
        await roomEngine.instance?.setCurrentCameraDevice({ deviceId: roomStore.currentCameraId });
        /**
         * Turn on the local camera
         *
         * 开启本地摄像头
        **/
        await roomEngine.instance?.setLocalVideoView({
          streamType: TUIVideoStreamType.kCameraStream,
          view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
        });
        if (isMobile) {
          await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
        } else {
          await roomEngine.instance?.openLocalCamera();
        }
        await roomEngine.instance?.startPushLocalVideo();
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
      await roomEngine.instance?.openLocalMicrophone();
      await roomEngine.instance?.startPushLocalAudio();
      const microphoneList = await roomEngine.instance?.getMicDevicesList();
      const speakerList = await roomEngine.instance?.getSpeakerDevicesList();
      if (!roomStore.currentMicrophoneId && microphoneList.length > 0) {
        roomStore.setCurrentMicrophoneId(microphoneList[0].deviceId);
      }
      if (!roomStore.currentSpeakerId && speakerList.length > 0) {
        roomStore.setCurrentSpeakerId(speakerList[0].deviceId);
      }
      await roomEngine.instance?.setCurrentMicDevice({ deviceId: roomStore.currentMicrophoneId });
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
