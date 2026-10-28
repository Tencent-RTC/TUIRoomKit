import { computed, ref, shallowRef, watch } from 'vue';
import {
  RoomParticipantEvent,
  RoomType,
  VideoStreamType,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '../../../base';
import { RoomLayoutTemplate } from '../../../core/types';
import { useWhiteboardState } from '../../../features';
import type { StreamInfo } from '../../../features';

const layoutTemplate = ref<RoomLayoutTemplate>(RoomLayoutTemplate.GridLayout);

/** The stream a double-click put on the speaker stage; resolved against live state on read. */
const selectedStream = ref<{ userId: string; streamType: VideoStreamType } | null>(null);

/** Whose camera holds the stage when nothing is picked; kept until that person leaves. */
const defaultStageUserId = ref('');

function isSpeakerTemplate(template: RoomLayoutTemplate): boolean {
  return template === RoomLayoutTemplate.SidebarLayout || template === RoomLayoutTemplate.CinemaLayout;
}

/**
 * The conference stage: which template it uses, whether it may change, and what it puts on stage.
 *
 * useRoomParticipantState() constructs CallEventManager, which must not exist before the SDK
 * room does (see RoomKit's entry). This hook runs while RoomKit is still entering, so the
 * participant state is only built once there is a roomId, and the whiteboard state, which
 * reads it too, only once the lock is read.
 */
export function useRoomLayoutState() {
  const { currentRoom } = useRoomState();
  const participants = shallowRef<ReturnType<typeof useRoomParticipantState> | null>(null);

  watch(
    () => currentRoom.value?.roomId,
    (roomId, _previousRoomId, onCleanup) => {
      if (!roomId) {
        selectedStream.value = null;
        defaultStageUserId.value = '';
        return;
      }
      participants.value ??= useRoomParticipantState();
      const {
        localParticipant,
        participantList,
        participantListWithVideo,
        participantWithScreen,
        subscribeEvent,
        unsubscribeEvent,
      } = participants.value;

      /* Default stage: the first camera on, else self. Cameras turning on or off do not move
         it; only its owner leaving lets the next pick in. */
      const stopDefaultPick = watch(
        [participantList, participantListWithVideo, localParticipant],
        () => {
          const holderId = defaultStageUserId.value;
          if (holderId && participantList.value.some(item => item.userId === holderId)) {
            return;
          }
          defaultStageUserId.value = (participantListWithVideo.value[0] ?? localParticipant.value)?.userId ?? '';
        },
        { immediate: true },
      );

      /* Template: standard rooms switch to the sidebar when a share starts, and back to
         the grid once a single stream is left. */
      const stopShareSwitch = watch(
        [() => currentRoom.value?.roomType, participantWithScreen],
        ([roomType, sharer]) => {
          if (roomType === RoomType.Standard && sharer) {
            layoutTemplate.value = RoomLayoutTemplate.SidebarLayout;
          }
        },
        { immediate: true },
      );

      const stopCountSwitch = watch(
        () => participantList.value.length + (participantWithScreen.value ? 1 : 0),
        (streamCount) => {
          if (
            currentRoom.value?.roomType === RoomType.Standard
            && streamCount === 1
            && layoutTemplate.value !== RoomLayoutTemplate.GridLayout
          ) {
            layoutTemplate.value = RoomLayoutTemplate.GridLayout;
          }
        },
      );

      /* Stage: a share taking or leaving the stage drops the pick. A new share outranks a
         picked camera, and a picked share is gone once it ends. */
      const stopPickReset = watch(participantWithScreen, (sharer) => {
        const selected = selectedStream.value;
        if (!selected) {
          return;
        }
        const stale = selected.streamType === VideoStreamType.Screen
          ? sharer?.userId !== selected.userId
          : Boolean(sharer);
        if (stale) {
          selectedStream.value = null;
        }
      });

      // Someone who left takes the pick with them, so coming back does not reclaim the stage.
      const handleParticipantLeft = ({ userInfo }: { userInfo: RoomUser }) => {
        if (userInfo.userId === selectedStream.value?.userId) {
          selectedStream.value = null;
        }
      };
      subscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);

      onCleanup(() => {
        stopDefaultPick();
        stopShareSwitch();
        stopCountSwitch();
        stopPickReset();
        unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
      });
    },
    { immediate: true },
  );

  /* Lock: a board or an annotation only runs on the stage tile, and starting one already puts
     the share there. Holding the layout and the stage keeps it from landing in a thumbnail. */
  let whiteboard: ReturnType<typeof useWhiteboardState> | null = null;
  const layoutLocked = computed(() => {
    whiteboard ??= useWhiteboardState();
    return whiteboard.isSessionActive.value;
  });

  function setLayoutTemplate(template: RoomLayoutTemplate) {
    if (layoutLocked.value) {
      TUIToast.info(t('Layout.LockedByWhiteboard'));
      return;
    }
    layoutTemplate.value = template;
  }

  /* Stage: the picked stream, then a share, then the default stage holder, then self. */
  const stageStream = computed<StreamInfo | null>(() => {
    if (!participants.value) {
      return null;
    }
    const { localParticipant, participantList, participantWithScreen } = participants.value;
    const sharer = participantWithScreen.value;
    const selected = selectedStream.value;
    if (selected?.streamType === VideoStreamType.Screen && sharer?.userId === selected.userId) {
      return { participant: sharer, streamType: VideoStreamType.Screen };
    }
    if (selected?.streamType === VideoStreamType.Camera) {
      // Someone who left is no longer in the list, so the pick falls through.
      const participant = participantList.value.find(item => item.userId === selected.userId);
      if (participant) {
        return { participant, streamType: VideoStreamType.Camera };
      }
    }
    if (sharer) {
      return { participant: sharer, streamType: VideoStreamType.Screen };
    }
    const participant = participantList.value.find(item => item.userId === defaultStageUserId.value)
      ?? localParticipant.value;
    return participant ? { participant, streamType: VideoStreamType.Camera } : null;
  });

  /** Only the speaker layouts have a stage to swap; the lock keeps it and says why. */
  function handleStreamDoubleClick(streamInfo: StreamInfo) {
    if (!isSpeakerTemplate(layoutTemplate.value)) {
      return;
    }
    if (layoutLocked.value) {
      TUIToast.info(t('Layout.StageLockedByWhiteboard'));
      return;
    }
    selectedStream.value = { userId: streamInfo.participant.userId, streamType: streamInfo.streamType };
  }

  return {
    layoutTemplate,
    layoutLocked,
    stageStream,
    setLayoutTemplate,
    handleStreamDoubleClick,
  };
}
