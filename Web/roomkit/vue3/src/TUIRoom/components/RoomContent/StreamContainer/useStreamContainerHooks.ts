import { ref } from 'vue';
import type { Ref } from 'vue';
import { useRoomStore, StreamInfo } from '../../../stores/room';
import { TRTCVolumeInfo } from '@tencentcloud/tuiroom-engine-js';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { throttle } from '../../../utils/utils';
import { LAYOUT } from '../../../constants/render';

export default function useStreamContainer() {
  /** --- The following processing stream events ---- **/
  const basicStore = useBasicStore();
  const roomStore = useRoomStore();
  const { layout } = storeToRefs(basicStore);
  const { localStream } = storeToRefs(roomStore);
  const { t } = useI18n();

  const currentRemoteSpeakerUserId: Ref<string> = ref('');
  const currentSpeakerUserId: Ref<string> = ref('');

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
      if (
        item.userId === basicStore.userId &&
        localStream.value.hasAudioStream
      ) {
        localUserVolume.volume = item.volume;
      } else if (
        item.userId !== basicStore.userId &&
        roomStore.userInfoObj[item.userId]?.hasAudioStream
      ) {
        const { userId, volume } = item;
        if (volume > largestRemoteUserVolume.volume) {
          largestRemoteUserVolume.userId = userId;
          largestRemoteUserVolume.volume = volume;
        }
      }
    });

    const largestUserVolume =
      localUserVolume.volume > largestRemoteUserVolume.volume
        ? localUserVolume
        : largestRemoteUserVolume;

    if (currentRemoteSpeakerUserId.value) {
      const lastRemoteSpeakerUserVolumeInfo = userVolumeList.find(
        (item: TRTCVolumeInfo) =>
          item.userId === currentRemoteSpeakerUserId.value
      );
      if (
        !lastRemoteSpeakerUserVolumeInfo ||
        lastRemoteSpeakerUserVolumeInfo.volume === 0
      ) {
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
      const lastSpeakerUserVolumeInfo: TRTCVolumeInfo | undefined =
        userVolumeList.find(
          (item: TRTCVolumeInfo) => item.userId === currentSpeakerUserId.value
        );
      if (
        !lastSpeakerUserVolumeInfo ||
        lastSpeakerUserVolumeInfo.volume === 0
      ) {
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
  const onUserVoiceVolumeChanged = (eventInfo: { userVolumeList: any[] }) => {
    const { userVolumeList } = eventInfo;
    if (layout.value === LAYOUT.LARGE_SMALL_WINDOW) {
      handleUserVoiceVolumeThrottle(userVolumeList);
    }
  };

  const isSameStream = (
    stream1: StreamInfo | null,
    stream2: StreamInfo | null
  ) =>
    `${stream1?.userId}_${stream1?.streamType}` ===
    `${stream2?.userId}_${stream2?.streamType}`;

  const getStreamKey = (stream: StreamInfo | null) =>
    `${stream?.userId}_${stream?.streamType}`;

  return {
    currentRemoteSpeakerUserId,
    currentSpeakerUserId,
    onUserVoiceVolumeChanged,
    isSameStream,
    getStreamKey,
    t,
  };
}
