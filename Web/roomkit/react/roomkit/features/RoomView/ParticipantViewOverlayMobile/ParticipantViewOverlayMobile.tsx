import type { CSSProperties } from 'react';
import {
  DeviceStatus,
  NetworkQuality,
  RoomParticipantRole,
  VideoStreamType,
  useLoginState,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { IconFlipCamera, IconMic, IconMicOff, IconRoleUser } from '../../../base';
import { useI18n } from '../../../i18n';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import './ParticipantViewOverlayMobile.scss';

export interface ParticipantViewOverlayMobileProps {
  participant: RoomParticipant;
  streamType: VideoStreamType;
  /** The camera window on the share page: no signal bars, and a smaller flip. */
  inPip?: boolean;
  /** A camera flip is still running; the flip button stays dimmed until it lands. */
  flipPending?: boolean;
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
  flipPending = false,
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

  /**
   * Top inset of the whole icon. The fill is a viewBox rect of the capsule
   * (y 2, height 8.5), so the cut is measured on the icon, not on the rect.
   */
  const waveInset = (() => {
    const level = Math.min(volume / SPEECH_PEAK, 1);
    const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
    const capsuleTop = 12.5;
    const capsuleHeight = 53.125;
    return (capsuleTop + (1 - scale) * capsuleHeight).toFixed(1);
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
        'participant-view-overlay-mobile',
        isSpeaking ? 'is-speaking' : '',
        inPip ? 'is-pip' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {showCameraOffMask && (
        <div
          className="participant-view-overlay-mobile-mask"
          aria-hidden="true"
        >
          <div className="participant-view-overlay-mobile-avatar">
            {avatarUrl
              ? (
                <img
                  className="participant-view-overlay-mobile-avatar-img"
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
          className={['participant-view-overlay-mobile-flip', flipPending ? 'is-pending' : ''].filter(Boolean).join(' ')}
          type="button"
          disabled={flipPending}
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
          className="participant-view-overlay-mobile-network"
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
        </span>
      )}

      <div className="participant-view-overlay-mobile-stack">
        <div className="participant-view-overlay-mobile-pill">
          <span className="participant-view-overlay-mobile-mic" aria-hidden="true">
            {micOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
            {isSpeaking && (
              <svg
                className="participant-view-overlay-mobile-mic-core"
                viewBox="0 0 16 16"
                aria-hidden="true"
                style={{ clipPath: `inset(${waveInset}% 0 0 0)` }}
              >
                <rect x="5.5" y="2" width="5" height="8.5" rx="2.5" />
              </svg>
            )}
          </span>

          {roleLabel && (
            <span
              className={['participant-view-overlay-mobile-role-mark', roleClass].filter(Boolean).join(' ')}
              role="img"
              aria-label={roleLabel}
            >
              <IconRoleUser size={14} />
            </span>
          )}

          <span className="participant-view-overlay-mobile-name">{displayName}</span>

          {isSelf && <span className="participant-view-overlay-mobile-me">{t('Participants.Me')}</span>}
        </div>
      </div>
    </div>
  );
}

export default ParticipantViewOverlayMobile;
