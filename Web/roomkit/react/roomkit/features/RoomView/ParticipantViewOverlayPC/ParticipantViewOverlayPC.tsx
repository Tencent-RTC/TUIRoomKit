import type { CSSProperties } from 'react';
import {
  DeviceStatus,
  NetworkQuality,
  RoomParticipantRole,
  VideoStreamType,
  useLoginState,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { IconMic, IconMicOff, IconMore, IconShare } from '../../../base/icons';
import { useI18n } from '../../../i18n';
import ParticipantMoreMenu from '../../Participants/ParticipantListPC/ParticipantMoreMenu.tsx';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantViewOverlayPC.scss';

export interface ParticipantViewOverlayPCProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
  /** Drop the more menu where the tile is too small to act on, like the mini window. */
  hideActions?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

export function ParticipantViewOverlayPC({
  participant,
  streamType,
  hideActions,
  className,
  style,
}: ParticipantViewOverlayPCProps) {
  const { t } = useI18n();
  const { speakingUsers, networkQualities } = useRoomParticipantState();
  const { loginUserInfo } = useLoginState();

  const displayName = participant.nameCard
    || participant.userName
    || participant.userId;

  const initial = (() => {
    const name = displayName.trim();
    return name ? name.charAt(0).toUpperCase() : '?';
  })();

  const avatarUrl = participant.avatarUrl || '';

  const isSelf = !!loginUserInfo?.userId
    && loginUserInfo.userId === participant.userId;

  const micOn = participant.microphoneStatus === DeviceStatus.On;

  const cameraOn = participant.cameraStatus === DeviceStatus.On;

  const showCameraOffMask = streamType === VideoStreamType.Camera && !cameraOn;

  const isScreenStream = streamType === VideoStreamType.Screen;

  const volume = speakingUsers.get(participant.userId) ?? 0;

  /* A share tile carries the sharer's volume, but a halo around a desktop says nothing
     about the desktop — their camera tile is where their speaking reads.
     Engine reports 0 when silent, so any positive volume counts as speaking. */
  const isSpeaking = !isScreenStream && micOn && volume > 0;

  /** How tall the bar stands right now, as a share of the slot it sits in. */
  const waveScale = (() => {
    const level = Math.min(volume / SPEECH_PEAK, 1);
    return (WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level).toFixed(2);
  })();

  const roleLabel = (() => {
    if (participant.role === RoomParticipantRole.Owner) {
      return t('Participants.Owner');
    }
    if (participant.role === RoomParticipantRole.Admin) {
      return t('Participants.Admin');
    }
    return '';
  })();

  const roleClass = (() => {
    if (participant.role === RoomParticipantRole.Owner) {
      return 'participant-view-overlay-role-owner';
    }
    if (participant.role === RoomParticipantRole.Admin) {
      return 'participant-view-overlay-role-admin';
    }
    return '';
  })();

  const networkQuality = networkQualities.get(participant.userId)?.quality
    ?? NetworkQuality.Unknown;

  const showNetworkBars = networkQuality >= NetworkQuality.Poor;

  return (
    <div
      className={['participant-view-overlay', isSpeaking ? 'is-speaking' : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {/* Camera-off: light tile fill + centered avatar only (design screenshot) */}
      {showCameraOffMask && (
        <div
          className="participant-view-overlay-mask"
          aria-hidden="true"
        >
          {avatarUrl
            ? (
              <div className="participant-view-overlay-avatar">
                <img
                  className="participant-view-overlay-avatar-img"
                  src={avatarUrl}
                  alt=""
                  draggable="false"
                />
              </div>
            )
            : (
              <div className="participant-view-overlay-avatar">
                {initial}
              </div>
            )}
        </div>
      )}

      {isScreenStream && (
        <div className="participant-view-overlay-share-badge">
          <IconShare size={10} />
          <span>{t('RoomView.SharingScreen')}</span>
        </div>
      )}

      {!hideActions && (
        <ParticipantMoreMenu
          participant={participant}
          placement="bottom-end"
        >
          {({ open }: { open: boolean }) => (
            <div
              className={['participant-view-overlay-more', open ? 'is-open' : ''].filter(Boolean).join(' ')}
              title={t('Participants.More')}
              aria-label={t('Participants.More')}
              onDoubleClick={e => e.stopPropagation()}
            >
              <IconMore size={14} />
            </div>
          )}
        </ParticipantMoreMenu>
      )}

      <div className="participant-view-overlay-footer">
        <div className="participant-view-overlay-pill">
          <span className="participant-view-overlay-mic" aria-hidden="true">
            {micOn ? <IconMic size={16} /> : <IconMicOff size={16} />}
            {/* The bar is the sign of speech, not of an open mic: an idle one sitting in
                every tile reads as everyone talking at once. */}
            {isSpeaking && (
              <span
                className="participant-view-overlay-mic-core"
                style={{ transform: `scaleY(${waveScale})` }}
              />
            )}
          </span>

          <span className="participant-view-overlay-name" title={displayName}>{displayName}</span>

          {isSelf && (
            <span
              className="participant-view-overlay-role participant-view-overlay-role-me"
            >
              {t('Participants.Me')}
            </span>
          )}
          {roleLabel && (
            <span
              className={['participant-view-overlay-role', roleClass].filter(Boolean).join(' ')}
            >
              {roleLabel}
            </span>
          )}
        </div>

        {showNetworkBars && (
          <span
            className="participant-view-overlay-network"
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
    </div>
  );
}

export default ParticipantViewOverlayPC;
