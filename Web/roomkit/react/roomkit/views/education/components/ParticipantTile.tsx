import {
  DeviceStatus,
  FillMode,
  RoomParticipantRole,
  RoomParticipantView,
  VideoStreamType,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { IconMicOff, TUIAvatar } from '../../../base';
import { useI18n } from '../../../i18n';
import './ParticipantTile.scss';

export interface ParticipantTileProps {
  participant?: RoomParticipant;
  /** Shown while the seat is empty. */
  placeholder: string;
  /** Smaller avatar and label, for the H5 seats. */
  compact?: boolean;
}

export function ParticipantTile(props: ParticipantTileProps) {
  const { participant, placeholder, compact = false } = props;
  const { t } = useI18n();

  return (
    <div className={['participant-tile', compact && 'is-compact'].filter(Boolean).join(' ')} data-tile-role="thumb">
      {participant
        ? (
          <div className="participant-tile-view">
            <RoomParticipantView
              participant={participant}
              streamType={VideoStreamType.Camera}
              fillMode={FillMode.Fill}
              lazyLoad={{ enable: false }}
              renderParticipantView={({ participant: viewer }) => {
                const displayName = viewer.userName || viewer.userId || '';
                return (
                  <>
                    {viewer.cameraStatus !== DeviceStatus.On && (
                      <div className="participant-tile-off">
                        <TUIAvatar size={compact ? 40 : 56} src={viewer.avatarUrl} alt={displayName} />
                      </div>
                    )}
                    <div className="participant-tile-name">
                      {viewer.microphoneStatus !== DeviceStatus.On && (
                        <IconMicOff className="participant-tile-mic-off" size={12} />
                      )}
                      <span className="participant-tile-name-text">{displayName}</span>
                      {viewer.role === RoomParticipantRole.Owner && (
                        <span className="participant-tile-tag">{t('Education.Teacher')}</span>
                      )}
                    </div>
                  </>
                );
              }}
            />
          </div>
        )
        : (
          <p className="participant-tile-empty">
            {placeholder}
          </p>
        )}
    </div>
  );
}

export default ParticipantTile;
