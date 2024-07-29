import { watch, ref } from 'vue';
import type { Ref } from 'vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import {  useRoomStore, StreamInfo } from '../../../stores/room';
import  { TUIChangeReason, TUIMediaDeviceType, TUIUserInfo, TRTCVolumeInfo } from '@tencentcloud/tuiroom-engine-electron';
import TUIMessage from '../../common/base/Message/index';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { MESSAGE_DURATION } from '../../../constants/message';
import { storeToRefs } from 'pinia';
import { isMobile, isWeChat } from '../../../utils/environment';
import logger from '../../../utils/common/logger';
import { SMALL_VIDEO_ENC_PARAM } from '../../../constants/room';
import useDeviceManager from '../../../hooks/useDeviceManager';
import { throttle } from '../../../utils/utils';
import { LAYOUT } from '../../../constants/render';

const logPrefix = '[StreamContainer]';

export default function useStreamContainer() {
  /** --- The following processing stream events ---- **/
  const roomEngine = useGetRoomEngine();
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { layout } = storeToRefs(basicStore);
  const { localStream } = storeToRefs(roomStore);
  const { t } = useI18n();
  const { deviceManager } = useDeviceManager();

  const currentRemoteSpeakerUserId: Ref<string> = ref('');
  const currentSpeakerUserId: Ref<string> = ref('');

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
       **/
      roomStore.setCanControlSelfAudio(!roomStore.isMicrophoneDisableForAllUser);
    }
  };

  // Calculate the userId of the loudest speaker in the room
  // Calculate the userId of the remote user who speaks the loudest in the current room.
  function handleUserVoiceVolume(userVolumeList: Array<TRTCVolumeInfo>) {
    const localUserVolume = {
      userId: basicStore.userId,
      volume: 0,
    };
    const largestRemoteUserVolume = {
      userId: '',
      volume: 0,
    };
    userVolumeList.forEach((item: TRTCVolumeInfo) => {
      if (item.userId === basicStore.userId && localStream.value.hasAudioStream) {
        localUserVolume.volume = item.volume;
      } else if (item.userId !== basicStore.userId && roomStore.remoteUserObj[item.userId]?.hasAudioStream) {
        const { userId, volume } = item;
        if (volume > largestRemoteUserVolume.volume) {
          largestRemoteUserVolume.userId = userId;
          largestRemoteUserVolume.volume = volume;
        }
      }
    });

    const largestUserVolume = localUserVolume.volume > largestRemoteUserVolume.volume
      ? localUserVolume : largestRemoteUserVolume;

    if (currentRemoteSpeakerUserId.value) {
      const lastRemoteSpeakerUserVolumeInfo = userVolumeList.find((item: TRTCVolumeInfo) => (
        item.userId === currentRemoteSpeakerUserId.value
      ));
      if (!lastRemoteSpeakerUserVolumeInfo || lastRemoteSpeakerUserVolumeInfo.volume === 0) {
        if (largestRemoteUserVolume.volume > 0) {
          currentRemoteSpeakerUserId.value = largestRemoteUserVolume.userId;
        }
      }
    } else {
      if (largestRemoteUserVolume.volume > 0) {
        currentRemoteSpeakerUserId.value = largestRemoteUserVolume.userId;
      }
    }

    if (currentSpeakerUserId.value) {
      const lastSpeakerUserVolumeInfo: TRTCVolumeInfo | undefined = userVolumeList.find((item: TRTCVolumeInfo) => (
        item.userId === currentSpeakerUserId.value
      ));
      if (!lastSpeakerUserVolumeInfo || lastSpeakerUserVolumeInfo.volume === 0) {
        if (largestUserVolume.volume > 0) {
          currentSpeakerUserId.value = largestUserVolume.userId;
        }
      }
    } else {
      if (largestUserVolume.volume > 0) {
        currentSpeakerUserId.value = largestUserVolume.userId;
      }
    }
  }

  const handleUserVoiceVolumeThrottle = throttle(handleUserVoiceVolume, 1000);

  // volume change
  const onUserVoiceVolumeChanged = (eventInfo: {
    userVolumeList: any[],
  }) => {
    const { userVolumeList } = eventInfo;
    if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
      handleUserVoiceVolumeThrottle(userVolumeList);
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
        await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
      } else if (isMobile) {
        const trtcCloud = roomEngine.instance?.getTRTCCloud();
        trtcCloud?.enableSmallVideoStream(false, SMALL_VIDEO_ENC_PARAM);
        await roomEngine.instance?.openLocalCamera({ isFrontCamera: basicStore.isFrontCamera });
        return;
      } else {
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
        await roomEngine.instance?.openLocalCamera();
      }
    }
  }, { immediate: true });

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
  }, { immediate: true });

  const isSameStream = (stream1: StreamInfo | null, stream2: StreamInfo | null) => `${stream1?.userId}_${stream1?.streamType}` === `${stream2?.userId}_${stream2?.streamType}`;

  return {
    currentRemoteSpeakerUserId,
    currentSpeakerUserId,
    onRemoteUserEnterRoom,
    onRemoteUserLeaveRoom,
    onSeatListChanged,
    onUserAudioStateChanged,
    onUserVoiceVolumeChanged,
    isSameStream,
    t,
  };
}
