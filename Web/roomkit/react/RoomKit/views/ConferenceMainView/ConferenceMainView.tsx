import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconLoadingSchedule, Watermark, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  KickedOutOfRoomReason,
  RoomEvent,
  RoomLayoutTemplate,
  RoomParticipantEvent,
  RoomParticipantRole,
  RoomType,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { conference as conferenceImpl, useFeatureConfig } from '../../adapter/conference';
import {
  RoomEvent as ConferenceRoomEvent,
} from '../../adapter/type';
import {
  CameraButton,
  ChatRegistrar,
  CurrentRoomInfo,
  InviteButton,
  LanguageButton,
  LayoutButton,
  LeaveRoomButton,
  LocalNetworkInfo,
  LoginUserInfo,
  MemberRegistrar,
  MicButton,
  PasswordDialog,
  RoomLayoutView,
  RoomSidePanel,
  ScreenShareButton,
  SettingsButton,
  ThemeButton,
} from '../../components';
import { OverflowBar } from '../../components/OverflowBar';
import { useCustomizedAutoPlayDialog } from '../../hooks/useCustomizedAutoPlayDialog';
import { useLoadingFade } from '../../hooks/useLoadingFade';
import useRoomLifeCycle from '../../hooks/useRoomLifeCycle';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { useRoomTips } from '../../hooks/useRoomTips';
import { useRoomToolbar } from '../../hooks/useRoomToolbar';
import { eventCenter } from '../../utils/eventCenter';
import styles from './ConferenceMainView.module.scss';
import type { IConference } from '../../adapter/type';
import type { ParticipantViewSlotProps } from '../../components';

type CachedRoomInfo = NonNullable<ReturnType<typeof useRoomState>['currentRoom']>;

const conference = conferenceImpl as unknown as IConference;

export interface ConferenceMainViewProps {
  /**
   * Custom renderer for each participant tile, forwarded to the underlying
   * `RoomLayoutView`. When omitted the layout falls back to its default tile.
   */
  renderParticipantView?: (props: ParticipantViewSlotProps) => ReactNode;
}

export function ConferenceMainView(props: ConferenceMainViewProps) {
  const { renderParticipantView } = props;

  const { t } = useUIKit();
  const roomPageRef = useRef<HTMLDivElement | null>(null);
  const { showToolbar } = useRoomToolbar(roomPageRef);
  const {
    activeId,
    sidePanelTitle,
    sidePanels,
    closePanel,
  } = useRoomSidePanel();

  useCustomizedAutoPlayDialog();
  useRoomTips();

  const { loginUserInfo } = useLoginState();
  const {
    currentRoom,
    subscribeEvent: subscribeRoomEvent,
    unsubscribeEvent: unsubscribeRoomEvent,
  } = useRoomState();
  const {
    localParticipant,
    participantList,
    audienceListCursor,
    participantListCursor,
    getParticipantList,
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
  const { mounted: loadingMounted, active: loadingActive } = useLoadingFade(isJoiningRoom);

  // Role / room-type derivations mirror the Vue `computed()` block 1:1.
  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const isOwner = localParticipant?.role === RoomParticipantRole.Owner;
  const isParticipant = participantList.some(
    participant => participant.userId === localParticipant?.userId,
  );
  const notWebinar = !isWebinar;
  const ownerOrNotWebinar = !isWebinar || isOwner;

  const [participantViewLayout, setParticipantViewLayout] = useState<
    RoomLayoutTemplate | undefined
  >(undefined);
  const handleLayoutUpdate = (layout: RoomLayoutTemplate) => {
    setParticipantViewLayout(layout);
  };

  const cachedRoomInfoRef = useRef<CachedRoomInfo | null>(null);
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

  const watermarkConfig = useMemo(() => conference.getFeatureConfig('watermark'), []);
  const watermarkEnabled = watermarkConfig?.enable !== false;
  const watermarkContent = useMemo(
    () =>
      watermarkConfig?.content ?? [
        loginUserInfo?.userName || '',
        loginUserInfo?.userId || '',
      ],
    [watermarkConfig, loginUserInfo?.userName, loginUserInfo?.userId],
  );
  const watermarkFont = useMemo(
    () => watermarkConfig?.font ?? { fontSize: 16 },
    [watermarkConfig],
  );

  const layoutTemplateConfig = useFeatureConfig('layoutTemplate');
  useEffect(() => {
    if (currentRoom?.roomType === RoomType.Webinar) {
      setParticipantViewLayout(undefined);
      return;
    }
    setParticipantViewLayout(layoutTemplateConfig ?? RoomLayoutTemplate.GridLayout);
  }, [currentRoom?.roomType, layoutTemplateConfig]);

  const participantListCursorRef = useRef(participantListCursor);
  participantListCursorRef.current = participantListCursor;
  const audienceListCursorRef = useRef(audienceListCursor);
  audienceListCursorRef.current = audienceListCursor;
  const prevRoomIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const roomId = currentRoom?.roomId;
    const oldRoomId = prevRoomIdRef.current;
    prevRoomIdRef.current = roomId;
    if (!oldRoomId && roomId) {
      const fetchLists = async () => {
        await getParticipantList({ cursor: participantListCursorRef.current });
      };
      fetchLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.roomId]);

  useEffect(() => {
    const onRoomEnded = () => {
      eventCenter.emit(ConferenceRoomEvent.ROOM_DISMISS, {
        roomInfo: cachedRoomInfoRef.current || currentRoom,
      });
    };

    const onKickedFromRoom = (eventInfo: {
      reason: KickedOutOfRoomReason;
      message: string;
    }) => {
      eventCenter.emit(ConferenceRoomEvent.KICKED_OUT, eventInfo);
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
      closePanel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layoutView = (
    <RoomLayoutView
      layoutTemplate={participantViewLayout}
      onLayoutTemplateChange={handleLayoutUpdate}
      renderParticipantView={renderParticipantView}
    />
  );

  return (
    <div
      id="roomPage"
      ref={roomPageRef}
      className={styles.roomPage}
    >
      {loadingMounted && (
        <div
          className={classNames(styles.loadingMask, {
            [styles.loadingMaskActive]: loadingActive,
          })}
        >
          <div className={styles.loadingSpinner}>
            <IconLoadingSchedule className={styles.loadingCircular} size="42px" />
            <p className={styles.loadingText}>{t('Room.EnteringRoom')}</p>
          </div>
        </div>
      )}

      <div className={styles.roomContainer}>
        <header
          className={classNames(styles.header, {
            [styles.toolbarHidden]: !showToolbar,
          })}
        >
          <div className={styles.headerLeft}>
            <ThemeButton />
            {notWebinar && (
              <LayoutButton
                layout={participantViewLayout}
                onLayoutChange={handleLayoutUpdate}
              />
            )}
            <LocalNetworkInfo />
          </div>
          <div className={styles.headerCenter}>
            <CurrentRoomInfo />
          </div>
          <div className={styles.headerRight}>
            <LanguageButton />
            <LoginUserInfo showLogout={false} />
          </div>
        </header>

        <main className={styles.roomMain}>
          {watermarkEnabled
            ? (
              <Watermark font={watermarkFont} content={watermarkContent}>
                {layoutView}
              </Watermark>
            )
            : (
              layoutView
            )}
        </main>

        <footer
          className={classNames(styles.controlBar, {
            [styles.toolbarHidden]: !showToolbar,
          })}
        >
          <div className={styles.controlLeft}>
            {(!isWebinar || isParticipant || isOwner) && <MicButton />}
            {ownerOrNotWebinar && <CameraButton />}
          </div>

          <OverflowBar className={styles.controlCenter}>
            {ownerOrNotWebinar && <ScreenShareButton />}
            {notWebinar && <InviteButton />}
            {notWebinar && <ChatRegistrar />}
            <MemberRegistrar />
            {ownerOrNotWebinar && <SettingsButton />}
          </OverflowBar>

          <div className={styles.controlRight}>
            <LeaveRoomButton onLeave={handleLeaveRoom} onEnd={handleEndRoom} />
          </div>
        </footer>

        <PasswordDialog
          visible={roomPasswordVisible}
          onVisibleChange={setRoomPasswordVisible}
          roomId={joiningRoomId}
          onCancel={handlePasswordCancel}
          onError={handleJoinRoomError}
        />
      </div>

      <RoomSidePanel
        className={classNames(styles.sidePanel, {
          [styles.sidePanelVisible]: activeId,
        })}
        title={sidePanelTitle}
        onClose={closePanel}
        activeId={activeId}
        panels={sidePanels}
      />
    </div>
  );
}
