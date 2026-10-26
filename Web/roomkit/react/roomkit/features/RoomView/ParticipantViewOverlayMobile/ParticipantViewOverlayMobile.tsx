import type { CSSProperties } from 'react';
import {
  DeviceStatus,
  NetworkQuality,
  RoomParticipantRole,
  VideoStreamType,
  useLoginState,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { IconFlipCamera, IconHostRole, IconMic, IconMicOff, IconRoleUser } from '../../../base';
import { useI18n } from '../../../i18n';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantViewOverlayMobile.scss';

export interface ParticipantViewOverlayMobileProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
  /** The camera window on the share page: no signal bars, and a smaller flip. */
  inPip?: boolean;
  /** The stage owns the flip: it outlives the tile, which paging remounts. */
  onFlipCamera?: () => void;
  className?: string;
  style?: CSSProperties;
}

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

export function ParticipantViewOverlayMobile({
  participant,
  streamType,
  inPip,
  onFlipCamera,
  className,
  style,
}: ParticipantViewOverlayMobileProps) {
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
  const isScreenStream = streamType === VideoStreamType.Screen;

  const showCameraOffMask = !isScreenStream && !cameraOn;

  const showFlipCamera = isSelf && cameraOn && !isScreenStream;

  const volume = speakingUsers.get(participant.userId) ?? 0;

  /* A share tile carries the sharer's volume; the halo belongs on their camera tile. */
  const isSpeaking = !isScreenStream && micOn && volume > 0;

  const waveScale = (() => {
    const level = Math.min(volume / SPEECH_PEAK, 1);
    return (WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level).toFixed(2);
  })();

  const isOwner = participant.role === RoomParticipantRole.Owner;

  const roleLabel = (() => {
    if (isOwner) {
      return t('Participants.Owner');
    }
    if (participant.role === RoomParticipantRole.Admin) {
      return t('Participants.Admin');
    }
    return '';
  })();

  const roleClass = isOwner ? 'is-owner' : 'is-admin';

  const networkQuality = networkQualities.get(participant.userId)?.quality
    ?? NetworkQuality.Unknown;

  const showNetworkBars = !inPip && networkQuality >= NetworkQuality.Poor;

  return (
    <div
      className={[
        'participant-view-overlay',
        'participant-view-overlay-mobile',
        isSpeaking ? 'is-speaking' : '',
        inPip ? 'is-pip' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {showCameraOffMask && (
        <div
          className="participant-view-overlay-mask"
          aria-hidden="true"
        >
          <div className="participant-view-overlay-avatar">
            {avatarUrl
              ? (
                <img
                  className="participant-view-overlay-avatar-img"
                  src={avatarUrl}
                  alt=""
                  draggable="false"
                />
              )
              : initial}
          </div>
        </div>
      )}

      {showFlipCamera && (
        <button
          className="participant-view-overlay-flip"
          type="button"
          aria-label={t('Device.FlipCamera')}
          onClick={(event) => {
            event.stopPropagation();
            onFlipCamera?.();
          }}
          onPointerDown={event => event.stopPropagation()}
        >
          <IconFlipCamera size={16} />
        </button>
      )}

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

      <div className="participant-view-overlay-stack">
        <div className="participant-view-overlay-pill">
          <span className="participant-view-overlay-mic" aria-hidden="true">
            {micOn ? <IconMic size={12} /> : <IconMicOff size={12} />}
            {isSpeaking && (
              <span
                className="participant-view-overlay-mic-core"
                style={{ transform: `scaleY(${waveScale})` }}
              />
            )}
          </span>

          {roleLabel && (
            <span
              className={['participant-view-overlay-role-mark', roleClass].filter(Boolean).join(' ')}
              role="img"
              aria-label={roleLabel}
            >
              {isOwner ? <IconHostRole size={12} /> : <IconRoleUser size={11} />}
            </span>
          )}

          <span className="participant-view-overlay-name">{displayName}</span>

          {isSelf && <span className="participant-view-overlay-me">{t('Participants.Me')}</span>}
        </div>
      </div>
    </div>
  );
}

export default ParticipantViewOverlayMobile;
