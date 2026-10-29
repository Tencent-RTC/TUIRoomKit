import { useEffect, useRef, useState } from 'react';
import type { ComponentProps, CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import {
  IconAlertCircle,
  IconClose,
  RoomKitProvider,
  ScheduledListPC,
  SchedulePanel,
  useI18n,
} from '@tencentcloud/roomkit-web-react';
import type {
  ScheduleOutcome,
  ScheduleRoomInput,
} from '@tencentcloud/roomkit-web-react';
import LocalPreview from './LocalPreview';
import RefreshReturnCard from './RefreshReturnCard';
import JoinCard from './JoinCard';
import PreconferenceTopbar from './PreconferenceTopbar';
import './PreconferencePC.scss';

/* eslint-disable no-await-in-loop */

const COMPACT_WIDTH = 950;
const ROOM_ID_ATTEMPTS = 5;

/** Meeting shape the ScheduledListPC edit callback hands back. */
type ScheduledMeeting = Parameters<NonNullable<ComponentProps<typeof ScheduledListPC>['onEdit']>>[0];

export interface PreconferencePCProps {
  className?: string;
  style?: CSSProperties;
  previewSlot?: ReactNode;
  devicesSlot?: ReactNode;
  onCreate?: () => void;
  onJoin?: (roomId: string, password?: string) => void;
  onLogout?: () => void;
}

export function PreconferencePC(props: PreconferencePCProps) {
  const {
    className,
    style,
    previewSlot,
    devicesSlot,
    onCreate,
    onJoin,
    onLogout,
  } = props;
  const { t } = useI18n();
  const { loginUserInfo } = useLoginState();
  const roomState = useRoomState();
  const displayUserName = loginUserInfo?.userName || loginUserInfo?.userId || '';
  const displayAvatarUrl = loginUserInfo?.avatarUrl || '';

  const [searchParams, setSearchParams] = useSearchParams();
  const [linkRoomId] = useState(() => searchParams.get('roomId') || '');
  const [showRefreshReturn, setShowRefreshReturn] = useState(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.type === 'reload' && Boolean(linkRoomId);
  });
  const [roomInput, setRoomInput] = useState<string | number | null>(linkRoomId);

  function dismissRefreshReturn() {
    setShowRefreshReturn(false);
    setRoomInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('roomId');
      return next;
    }, { replace: true });
  }

  const [viewNode, setViewNode] = useState<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting>();
  const [faultBannerKey, setFaultBannerKey] = useState<string>();
  // The document keydown listener is bound once and reads the current value.
  const previewOpenRef = useRef(previewOpen);
  previewOpenRef.current = previewOpen;

  function closePreview() {
    setPreviewOpen(false);
  }

  function onCloseKeydown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    closePreview();
  }

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && previewOpenRef.current) {
        closePreview();
      }
    }
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('keydown', onKeydown);
    };
  }, []);

  // RoomKitProvider mounts this node only after it is ready, so the observer
  // has to follow the node instead of the first effect.
  useEffect(() => {
    if (!viewNode || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const node = viewNode;
    function measure() {
      const nextCompact = node.offsetWidth > 0 && node.offsetWidth < COMPACT_WIDTH;
      setCompact(nextCompact);
      if (!nextCompact) {
        setPreviewOpen(false);
      }
    }
    const resizeObserver = new ResizeObserver(() => {
      queueMicrotask(measure);
    });
    resizeObserver.observe(node);
    queueMicrotask(measure);
    return () => {
      resizeObserver.disconnect();
    };
  }, [viewNode]);

  async function isRoomIdFree(roomId: string): Promise<boolean> {
    try {
      await roomState.getRoomInfo({ roomId });
      return false;
    } catch (error) {
      if ((error as { code?: number })?.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) return true;
      throw error;
    }
  }

  async function scheduleMeeting(input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    const options = {
      roomName: input.roomName,
      scheduleStartTime: input.scheduledStartTime,
      scheduleEndTime: input.scheduledEndTime,
      scheduleAttendees: input.scheduleAttendees,
      password: input.password || '',
      isAllMicrophoneDisabled: !!input.isAllMicrophoneDisabled,
      isAllCameraDisabled: !!input.isAllCameraDisabled,
    };
    try {
      for (let attempt = 0; attempt < ROOM_ID_ATTEMPTS; attempt += 1) {
        const roomId = String(Math.floor(100000 + Math.random() * 900000));
        if (await isRoomIdFree(roomId)) {
          try {
            await roomState.scheduleRoom({ roomId, options });
            return { roomId };
          } catch (error) {
            if ((error as { code?: number })?.code !== TUIErrorCode.ERR_ROOM_ID_OCCUPIED) throw error;
          }
        }
      }
      return { failure: 'id-exhausted' };
    } catch (error) {
      console.error('[PreconferencePC] Failed to schedule room:', error);
      return { failure: 'failed' };
    }
  }

  async function updateMeeting(meeting: ScheduledMeeting, input: ScheduleRoomInput): Promise<ScheduleOutcome> {
    const { roomId } = meeting;
    const before = meeting.attendees.map(user => user.userId);
    const after = input.scheduleAttendees;
    const added = after.filter(userId => !before.includes(userId));
    const removed = before.filter(userId => !after.includes(userId));
    try {
      await roomState.updateScheduledRoom({
        roomId,
        options: {
          roomName: input.roomName,
          scheduleStartTime: input.scheduledStartTime,
          scheduleEndTime: input.scheduledEndTime,
        },
      });
      if (added.length) await roomState.addScheduledAttendees({ roomId, userIdList: added });
      if (removed.length) await roomState.removeScheduledAttendees({ roomId, userIdList: removed });
      return { roomId };
    } catch (error) {
      console.error('[PreconferencePC] Failed to update scheduled room:', error);
      return { failure: 'failed' };
    }
  }

  function submitSchedule(input: ScheduleRoomInput) {
    return editingMeeting ? updateMeeting(editingMeeting, input) : scheduleMeeting(input);
  }

  function openSchedule(meeting?: ScheduledMeeting) {
    setEditingMeeting(meeting);
    setScheduleOpen(true);
  }

  return (
    <RoomKitProvider
      className={['preconference-root', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div
        ref={setViewNode}
        className={[
          'preconference-view',
          compact ? 'is-compact' : '',
          compact && previewOpen ? 'is-preview-open' : '',
        ].filter(Boolean).join(' ')}
      >
        <PreconferenceTopbar
          userName={displayUserName}
          avatarUrl={displayAvatarUrl}
          compact={compact}
          previewOpen={previewOpen}
          onLogout={() => onLogout?.()}
          onOpenPreview={() => setPreviewOpen(true)}
        />
        {faultBannerKey && (
          <div className="pre-fault-banner">
            <IconAlertCircle size={14} />
            <span>{t(faultBannerKey)}</span>
          </div>
        )}
        <main className="pre-main">
          {compact && previewOpen && (
            <div
              className="preview-backdrop"
              onClick={closePreview}
            />
          )}
          <div className="pre-grid">
            <section
              className="preview-card"
              aria-label={t('Preconference.PreviewRegion')}
            >
              <div
                className="preview-compact-close"
                role="button"
                tabIndex={0}
                aria-label={t('Preconference.ClosePreview')}
                onClick={closePreview}
                onKeyDown={onCloseKeydown}
              >
                <IconClose size={12} />
              </div>
              {previewSlot != null
                ? previewSlot
                : (!compact || previewOpen) && (
                  <LocalPreview
                    onBannerChange={setFaultBannerKey}
                  />
                )}
              {devicesSlot}
            </section>
            <div className="join-side">
              <div
                className={['join-stack', showRefreshReturn ? 'is-refresh-return' : ''].filter(Boolean).join(' ')}
              >
                <JoinCard
                  roomId={roomInput}
                  onUpdateRoomId={setRoomInput}
                  onCreate={() => onCreate?.()}
                  onSchedule={() => openSchedule()}
                  onJoin={roomId => onJoin?.(roomId)}
                />
                <RefreshReturnCard
                  onConfirm={() => onJoin?.(linkRoomId)}
                  onCancel={dismissRefreshReturn}
                />
              </div>
              <ScheduledListPC
                onJoin={(roomId: string) => onJoin?.(roomId)}
                onEdit={meeting => openSchedule(meeting)}
              />
            </div>
          </div>
        </main>
        <SchedulePanel
          open={scheduleOpen}
          onUpdateOpen={setScheduleOpen}
          userName={displayUserName}
          meeting={editingMeeting}
          schedule={submitSchedule}
          onScheduled={() => setEditingMeeting(undefined)}
        />
      </div>
    </RoomKitProvider>
  );
}

export default PreconferencePC;
