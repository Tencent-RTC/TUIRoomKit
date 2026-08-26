import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  IconLoadingSchedule,
  Watermark,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  KickedOutOfRoomReason,
  RoomEvent,
  RoomParticipantEvent,
  RoomParticipantRole,
  RoomType,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { useFeatureConfig } from '../../adapter/conference';
import { RoomEvent as ConferenceRoomEvent } from '../../adapter/type';
import {
  CameraButtonH5,
  ChatButtonH5,
  CloudRecordingButtonH5,
  CloudRecordingStatusH5,
  CurrentRoomInfoH5,
  ExpandFooterH5,
  LeaveRoomButtonH5,
  MemberButtonH5,
  MicButtonH5,
  PasswordDialogH5,
  RoomLayoutViewH5,
  SettingButtonH5,
  SwitchCameraButtonH5,
} from '../../components';
import { useCustomizedAutoPlayDialog } from '../../hooks/useCustomizedAutoPlayDialog';
import { useLoadingFade } from '../../hooks/useLoadingFade';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbarH5 } from '../../hooks/useRoomToolbarH5';
import { eventCenter } from '../../utils/eventCenter';
import styles from './ConferenceMainViewH5.module.scss';
import type { ParticipantViewSlotPropsH5 } from '../../components';

export interface ConferenceMainViewH5Props {
  /**
   * Render prop for customizing per-participant video tiles. React equivalent
   * of Vue's `<template #participantViewUI>` scoped slot.
   */
  renderParticipantView?: (slotProps: ParticipantViewSlotPropsH5) => ReactNode;
}

export function ConferenceMainViewH5({
  renderParticipantView,
}: ConferenceMainViewH5Props = {}) {
  const { t } = useUIKit();
  const { showToolbar, toggleToolbar } = useRoomToolbarH5();

  useCustomizedAutoPlayDialog();
  useRoomTips();

  const { loginUserInfo } = useLoginState();
  const {
    currentRoom,
    subscribeEvent: subscribeRoomEvent,
    unsubscribeEvent: unsubscribeRoomEvent,
  } = useRoomState();
  const {
    getParticipantList,
    participantListCursor,
    localParticipant,
    subscribeEvent: subscribeRoomParticipantEvent,
    unsubscribeEvent: unsubscribeRoomParticipantEvent,
  } = useRoomParticipantState();
  const {
    isJoiningRoom,
    joiningRoomId,
    roomPasswordVisible,
    setRoomPasswordVisible,
    handleJoinRoomError,
  } = useRoomLifeCycle();
  // Vue H5: v-tui-loading on <main> while isJoiningRoom.
  const { mounted: loadingMounted, active: loadingActive } = useLoadingFade(isJoiningRoom);

  const watermarkConfig = useFeatureConfig('watermark');
  const watermarkEnabled = watermarkConfig?.enable !== false;
  const watermarkContent = watermarkConfig?.content ?? [
    loginUserInfo?.userName || '',
    loginUserInfo?.userId || '',
  ];
  const watermarkFont = watermarkConfig?.font ?? { fontSize: 16 };
  const watermarkGap: [number, number] = watermarkConfig?.gap ?? [0, 100];

  // Widget-visibility flags in Vue live on `conference.getWidgetVisible(...)`,
  // which the React adapter hasn't shipped yet. Registrar / CustomWidgetRenderer
  // is out of scope for the H5 first pass (Vue's `notWebinar()` /
  // `ownerOrNotWebinar()` role gating stays in place), so buttons are wired
  // directly — mirrors the PC-version ConferenceMainView.
  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const isOwner = localParticipant?.role === RoomParticipantRole.Owner;
  const isAdmin = localParticipant?.role === RoomParticipantRole.Admin;
  const ownerOrNotWebinar = !isWebinar || isOwner;
  const isOwnerOrAdmin = isOwner || isAdmin;

  // Cache roomInfo before leave/dismiss since SDK may clear currentRoom
  // after the operation. Mirrors Vue's `cachedRoomInfo` deep-watch.
  const cachedRoomInfoRef = useRef<typeof currentRoom | null>(null);
  useEffect(() => {
    if (currentRoom?.roomId) {
      cachedRoomInfoRef.current = { ...currentRoom };
    }
  }, [currentRoom]);

  const handlePasswordCancel = () => {
    eventCenter.emit(ConferenceRoomEvent.ROOM_ERROR);
  };
  const handleLeaveRoom = () => {
    eventCenter.emit(ConferenceRoomEvent.ROOM_LEAVE, {
      roomInfo: cachedRoomInfoRef.current || currentRoom,
    });
  };
  const handleEndRoom = () => {
    eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, {
      roomInfo: cachedRoomInfoRef.current || currentRoom,
    });
  };

  // Fetch participant list on first room-join, matching Vue's
  // `watch(() => currentRoom.value?.roomId, ..., { immediate: true })`.
  const participantListCursorRef = useRef(participantListCursor);
  participantListCursorRef.current = participantListCursor;
  const prevRoomIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const roomId = currentRoom?.roomId;
    const oldRoomId = prevRoomIdRef.current;
    prevRoomIdRef.current = roomId;
    if (!oldRoomId && roomId) {
      getParticipantList({ cursor: participantListCursorRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.roomId]);

  useEffect(() => {
    const onRoomEnded = () => {
      eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, {
        roomInfo: cachedRoomInfoRef.current || currentRoom,
      });
    };
    const onKickedFromRoom = (_eventInfo: {
      reason: KickedOutOfRoomReason;
      message: string;
    }) => {
      eventCenter.emit(ConferenceRoomEvent.KICKED_OUT, {});
    };
    subscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
    subscribeRoomParticipantEvent(
      RoomParticipantEvent.onKickedFromRoom,
      onKickedFromRoom,
    );
    return () => {
      unsubscribeRoomEvent(RoomEvent.onRoomEnded, onRoomEnded);
      unsubscribeRoomParticipantEvent(
        RoomParticipantEvent.onKickedFromRoom,
        onKickedFromRoom,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layoutSlot = renderParticipantView
    ? (
      <RoomLayoutViewH5 renderParticipantView={renderParticipantView} />
    )
    : (
      <RoomLayoutViewH5 />
    );

  return (
    <div id="roomPage" className={styles.roomPage}>
      <div className={styles.roomContainer}>
        <header
          className={classNames(styles.header, {
            [styles.toolbarHidden]: !showToolbar,
          })}
        >
          <div className={styles.headerLeft}>
            <SwitchCameraButtonH5 />
          </div>
          <div className={styles.headerCenter}>
            <CurrentRoomInfoH5 />
          </div>
          <div className={styles.headerRight}>
            <LeaveRoomButtonH5 onLeave={handleLeaveRoom} onEnd={handleEndRoom} />
          </div>
        </header>

        <main
          className={styles.roomMain}
          onClick={toggleToolbar}
        >
          {loadingMounted && (
            <div
              className={classNames(styles.loadingMask, {
                [styles.loadingMaskActive]: loadingActive,
              })}
              role="alert"
              aria-busy="true"
              aria-live="polite"
              aria-label={t('Room.EnteringRoom')}
            >
              <div className={styles.loadingSpinner}>
                <IconLoadingSchedule
                  className={styles.loadingCircular}
                  size="42px"
                  aria-hidden="true"
                />
                <p className={styles.loadingText}>{t('Room.EnteringRoom')}</p>
              </div>
            </div>
          )}
          <div
            className={classNames(styles.recordingStatusAnchor, {
              [styles.toolbarVisible]: showToolbar,
            })}
          >
            {/* Keep mounted for every role so recording events reach all participants. */}
            <CloudRecordingStatusH5 />
          </div>
          {watermarkEnabled
            ? (
              <Watermark
                font={watermarkFont}
                content={watermarkContent}
                gap={watermarkGap}
              >
                {layoutSlot}
              </Watermark>
            )
            : (
              layoutSlot
            )}
        </main>

        <footer
          className={classNames(styles.roomFooter, {
            [styles.toolbarHidden]: !showToolbar,
          })}
        >
          <ExpandFooterH5>
            <MemberButtonH5 />
            <MicButtonH5 />
            <CameraButtonH5 />
            {/* Chat: hidden in Webinar (matches Vue's `notWebinar()`). */}
            {!isWebinar && <ChatButtonH5 />}
            {/* Recording: owner/admin only. Vue's Registrar checks the same. */}
            {isOwnerOrAdmin && <CloudRecordingButtonH5 />}
            {/* TODO(Day 4): Invite/AI H5 buttons — Webinar hides them too. */}
            {ownerOrNotWebinar && <SettingButtonH5 />}
          </ExpandFooterH5>
        </footer>

        <PasswordDialogH5
          visible={roomPasswordVisible}
          onVisibleChange={setRoomPasswordVisible}
          roomId={joiningRoomId}
          onCancel={handlePasswordCancel}
          onError={handleJoinRoomError}
        />
      </div>
    </div>
  );
}
