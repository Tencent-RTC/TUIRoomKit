import { onMounted, onUnmounted, readonly, ref } from 'vue';
import {
  CallRejectReason,
  RoomEvent,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomCall, RoomInfo, RoomType } from 'tuikit-atomicx-vue3/room';
import { TUIToast, t } from '@tencentcloud/roomkit-web-vue3-next';

const INVITE_DURATION_SECONDS = 60;

export interface IncomingInvitation {
  roomId: string;
  roomName: string;
  inviterName: string;
  inviterAvatar: string;
  password?: string;
  roomType?: RoomType;
}

export interface AcceptCallParams {
  roomId: string;
  password?: string;
  roomType?: RoomType;
}

export interface UseRoomInvitationOptions {
  onAcceptCall?: (params: AcceptCallParams) => void;
}

export function useRoomInvitation(options?: UseRoomInvitationOptions) {
  const incoming = ref<IncomingInvitation | null>(null);
  const countdown = ref(0);
  const { currentRoom, subscribeEvent, unsubscribeEvent, acceptCall, rejectCall } = useRoomState();
  let countdownTimer: ReturnType<typeof setInterval> | undefined;

  function clearCountdown() {
    if (countdownTimer !== undefined) {
      clearInterval(countdownTimer);
      countdownTimer = undefined;
    }
    countdown.value = 0;
  }

  function hide() {
    incoming.value = null;
    clearCountdown();
  }

  function startCountdown(duration: number) {
    clearCountdown();
    countdown.value = Math.max(1, duration);
    countdownTimer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value > 0) {
        return;
      }
      void settle('timeout');
    }, 1000);
  }

  function show(next: IncomingInvitation) {
    const previous = incoming.value;
    if (previous && previous.roomId !== next.roomId) {
      void rejectCall({ roomId: previous.roomId });
    }
    incoming.value = next;
    startCountdown(INVITE_DURATION_SECONDS);
  }

  async function settle(action: 'accept' | 'reject' | 'timeout') {
    const current = incoming.value;
    if (!current) {
      return;
    }
    hide();
    try {
      if (action === 'accept') {
        await acceptCall({ roomId: current.roomId });
        options?.onAcceptCall?.({
          roomId: current.roomId,
          password: current.password,
          roomType: current.roomType,
        });
        return;
      }
      await rejectCall({ roomId: current.roomId });
      TUIToast.info(t(action === 'timeout' ? 'RoomInvitation.Timeout' : 'RoomInvitation.Rejected'));
    } catch (error) {
      console.error(`[useRoomInvitation] Failed to ${action} invitation:`, error);
      if (action === 'accept') {
        TUIToast.error(t('RoomInvitation.AcceptFailed'));
      }
    }
  }

  function onCallReceived({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
    if (currentRoom.value?.roomId) {
      void rejectCall({
        roomId: roomInfo.roomId,
        reason: CallRejectReason.InOtherRoom,
      });
      return;
    }
    show({
      roomId: roomInfo.roomId,
      roomName: roomInfo.roomName || roomInfo.roomId,
      inviterName: call.caller.userName || call.caller.userId,
      inviterAvatar: call.caller.avatarUrl || '',
      password: roomInfo.password || undefined,
      roomType: roomInfo.roomType,
    });
  }

  function onCallHandledByOtherDevice() {
    if (!incoming.value) {
      return;
    }
    hide();
    TUIToast.info(t('RoomInvitation.HandleByOtherDevice'));
  }

  function onCallClosed({ roomInfo }: { roomInfo: RoomInfo }) {
    if (incoming.value?.roomId === roomInfo.roomId) {
      hide();
    }
  }

  onMounted(() => {
    subscribeEvent(RoomEvent.onCallReceived, onCallReceived);
    subscribeEvent(RoomEvent.onCallHandledByOtherDevice, onCallHandledByOtherDevice);
    subscribeEvent(RoomEvent.onCallCancelled, onCallClosed);
    subscribeEvent(RoomEvent.onCallTimeout, onCallClosed);
  });

  onUnmounted(() => {
    unsubscribeEvent(RoomEvent.onCallReceived, onCallReceived);
    unsubscribeEvent(RoomEvent.onCallHandledByOtherDevice, onCallHandledByOtherDevice);
    unsubscribeEvent(RoomEvent.onCallCancelled, onCallClosed);
    unsubscribeEvent(RoomEvent.onCallTimeout, onCallClosed);
    hide();
  });

  return {
    incoming: readonly(incoming),
    countdown: readonly(countdown),
    accept: () => settle('accept'),
    reject: () => settle('reject'),
  };
}
