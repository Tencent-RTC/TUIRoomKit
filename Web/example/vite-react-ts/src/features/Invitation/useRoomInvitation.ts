import { useEffect, useRef, useState } from 'react';
import {
  CallRejectReason,
  RoomEvent,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomCall, RoomInfo, RoomType } from 'tuikit-atomicx-react/room';
import { TUIToast, t } from '@tencentcloud/roomkit-web-react';

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
  const [incoming, setIncomingState] = useState<IncomingInvitation | null>(null);
  const [countdown, setCountdownState] = useState(0);
  // Event handlers and the timer outlive a render, so they read the current values here.
  const incomingRef = useRef<IncomingInvitation | null>(null);
  const countdownRef = useRef(0);
  const { currentRoom, subscribeEvent, unsubscribeEvent, acceptCall, rejectCall } = useRoomState();
  const latestRef = useRef({ options, currentRoom, acceptCall, rejectCall });
  latestRef.current = { options, currentRoom, acceptCall, rejectCall };
  const countdownTimerRef = useRef<ReturnType<typeof setInterval>>();

  function setIncoming(next: IncomingInvitation | null) {
    incomingRef.current = next;
    setIncomingState(next);
  }

  function setCountdown(next: number) {
    countdownRef.current = next;
    setCountdownState(next);
  }

  function clearCountdown() {
    if (countdownTimerRef.current !== undefined) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = undefined;
    }
    setCountdown(0);
  }

  function hide() {
    setIncoming(null);
    clearCountdown();
  }

  function startCountdown(duration: number) {
    clearCountdown();
    setCountdown(Math.max(1, duration));
    countdownTimerRef.current = setInterval(() => {
      setCountdown(countdownRef.current - 1);
      if (countdownRef.current > 0) {
        return;
      }
      void settle('timeout');
    }, 1000);
  }

  function show(next: IncomingInvitation) {
    const previous = incomingRef.current;
    if (previous && previous.roomId !== next.roomId) {
      void latestRef.current.rejectCall({ roomId: previous.roomId });
    }
    setIncoming(next);
    startCountdown(INVITE_DURATION_SECONDS);
  }

  async function settle(action: 'accept' | 'reject' | 'timeout') {
    const current = incomingRef.current;
    if (!current) {
      return;
    }
    hide();
    try {
      if (action === 'accept') {
        await latestRef.current.acceptCall({ roomId: current.roomId });
        latestRef.current.options?.onAcceptCall?.({
          roomId: current.roomId,
          password: current.password,
          roomType: current.roomType,
        });
        return;
      }
      await latestRef.current.rejectCall({ roomId: current.roomId });
      TUIToast.info(t(action === 'timeout' ? 'RoomInvitation.Timeout' : 'RoomInvitation.Rejected'));
    } catch (error) {
      console.error(`[useRoomInvitation] Failed to ${action} invitation:`, error);
      if (action === 'accept') {
        TUIToast.error(t('RoomInvitation.AcceptFailed'));
      }
    }
  }

  useEffect(() => {
    function onCallReceived({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
      if (latestRef.current.currentRoom?.roomId) {
        void latestRef.current.rejectCall({
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
      if (!incomingRef.current) {
        return;
      }
      hide();
      TUIToast.info(t('RoomInvitation.HandleByOtherDevice'));
    }

    function onCallClosed({ roomInfo }: { roomInfo: RoomInfo }) {
      if (incomingRef.current?.roomId === roomInfo.roomId) {
        hide();
      }
    }

    subscribeEvent(RoomEvent.onCallReceived, onCallReceived);
    subscribeEvent(RoomEvent.onCallHandledByOtherDevice, onCallHandledByOtherDevice);
    subscribeEvent(RoomEvent.onCallCancelled, onCallClosed);
    subscribeEvent(RoomEvent.onCallTimeout, onCallClosed);
    return () => {
      unsubscribeEvent(RoomEvent.onCallReceived, onCallReceived);
      unsubscribeEvent(RoomEvent.onCallHandledByOtherDevice, onCallHandledByOtherDevice);
      unsubscribeEvent(RoomEvent.onCallCancelled, onCallClosed);
      unsubscribeEvent(RoomEvent.onCallTimeout, onCallClosed);
      hide();
    };
  }, []);

  return {
    incoming,
    countdown,
    accept: () => settle('accept'),
    reject: () => settle('reject'),
  };
}
