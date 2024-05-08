import { watch } from 'vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {  useRoomStore } from '../../../stores/room';
import  { TUIChangeReason, TUIMediaDeviceType,  TUIUserInfo } from '@tencentcloud/tuiroom-engine-wx';
import TUIMessage from '../../common/base/Message/index';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { MESSAGE_DURATION } from '../../../constants/message';
import { storeToRefs } from 'pinia';
import { isMobile, isWeChat } from '../../../utils/environment';
import logger from '../../../utils/common/logger';
import { SMALL_VIDEO_ENC_PARAM } from '../../../constants/room';
import useDeviceManager from '../../../hooks/useDeviceManager';

const logPrefix = '[StreamContainer]';

export default function useStreamContainer() {
  /**
   * --- The following processing stream events ----
   *
   **/
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { t } = useI18n();
  const { deviceManager } = useDeviceManager();

  const onRemoteUserEnterRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
    roomStore.addRemoteUser(eventInfo.userInfo);
  };

  const onRemoteUserLeaveRoom = (eventInfo: { userInfo: TUIUserInfo }) => {
    roomStore.removeRemoteUser(eventInfo.userInfo.userId);
  };

  const onSeatListChanged = (eventInfo: { seatList: any[], seatedList: any[], leftList: any[] }) => {
    const { seatedList, leftList } = eventInfo;
    roomStore.updateOnSeatList(seatedList, leftList);
  };

  const onUserAudioStateChanged = (eventInfo: {
    userId: string,
    hasAudio: boolean,
    reason: TUIChangeReason,
  }) => {
    const { userId, hasAudio, reason } = eventInfo;
    roomStore.updateUserAudioState(userId, hasAudio);
    if (userId === basicStore.userId && !hasAudio && reason === TUIChangeReason.kChangedByAdmin) {
      TUIMessage({
        type: 'warning',
        message: t('Your microphone has been turned off'),
        duration: MESSAGE_DURATION.NORMAL,
      });
      /**
       * When the host turns on a full ban, the microphone of a single person is turned on
       * and off separately, and the microphone status of the corresponding user is inoperable at this time
       *
       **/
      roomStore.setCanControlSelfAudio(!roomStore.isMicrophoneDisableForAllUser);
    }
  };
  const {
    isDefaultOpenCamera,
    isDefaultOpenMicrophone,
  } = storeToRefs(roomStore);

  watch(isDefaultOpenCamera, async (val) => {
    if (val) {
      /**
       * Turn on the local camera
       *
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
        **/
        if (!roomStore.currentCameraId) {
          const cameraList = await deviceManager.instance?.getDevicesList({
            type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
          });
          if (cameraList && cameraList.length > 0) {
            roomStore.setCurrentCameraId(cameraList[0].deviceId);
          }
        }
        await deviceManager.instance?.setCurrentDevice({
          type: TUIMediaDeviceType.kMediaDeviceTypeVideoCamera,
          deviceId: roomStore.currentCameraId,
        });
        /**
         * Turn on the local camera
         *
        **/
        await roomEngine.instance?.setLocalVideoView({
          view: `${roomStore.localStream.userId}_${roomStore.localStream.streamType}`,
        });
        await roomEngine.instance?.openLocalCamera();
      }
    }
  }, {immediate: true});

  watch(isDefaultOpenMicrophone, async (val) => {
    if (val) {
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
  }, {immediate: true});
  return {
    onRemoteUserEnterRoom,
    onRemoteUserLeaveRoom,
    onSeatListChanged,
    onUserAudioStateChanged,
    t,
  };
}
