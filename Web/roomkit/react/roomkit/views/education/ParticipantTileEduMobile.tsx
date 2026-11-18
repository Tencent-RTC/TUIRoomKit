import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import { IconMic, IconMicOff, IconNet, IconTrophyUi, TUIAvatar, useI18n, useUIConfig } from '../../base';
import type { TileData } from './classroomData';
import waitStudent from './assets/wait-student.svg';
import waitTeacher from './assets/wait-teacher.svg';
import './ParticipantTileEduMobile.scss';

export interface ParticipantTileEduMobileProps {
  tile: TileData;
  /** `stage` fills the main area and letterboxes; `thumb` is the 4:3 rail seat. */
  tileRole: 'stage' | 'thumb';
  /** The view places the tile in its grid area. */
  className?: string;
  /** Where the trophy celebration lands; the view sets it on the student seat. */
  trophyLanding?: string;
}

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

export function ParticipantTileEduMobile(props: ParticipantTileEduMobileProps) {
  const { tile, tileRole, className, trophyLanding } = props;
  const { t } = useI18n();
  const { uiConfig } = useUIConfig();
  const { speakingUsers, localParticipant } = useRoomParticipantState();

  const CustomUI = uiConfig.participantViewUI;
  const faceSize = tileRole === 'stage' ? 72 : 36;

  const userId = tile.participant?.userId;
  let volume = 0;
  if (userId) {
    const reported = speakingUsers.get(userId) ?? 0;
    // The engine reports the local user under "", so a self tile misses its own level.
    volume = userId !== localParticipant?.userId ? reported : Math.max(reported, speakingUsers.get('') ?? 0);
  }

  /** Engine reports 0 when silent, so any positive volume counts as speaking. */
  const isSpeaking = tile.micOn && volume > 0;

  /**
   * Top inset of the whole icon. The fill is a viewBox rect of the capsule
   * (y 2, height 8.5), so the cut is measured on the icon, not on the rect.
   */
  const level = Math.min(volume / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  const capsuleTop = 12.5;
  const capsuleHeight = 53.125;
  const waveInset = (capsuleTop + (1 - scale) * capsuleHeight).toFixed(1);

  return (
    <div
      className={['edu-tile-mobile', tile.participant ? '' : 'is-waiting', tile.seat === 'teacher' ? 'is-teacher' : '', isSpeaking ? 'is-speaking' : '', className].filter(Boolean).join(' ')}
      data-tile-role={tileRole}
      data-trophy-landing={trophyLanding}
    >
      {tile.participant
        ? (
          <div className="edu-tile-mobile-view">
            <RoomParticipantView
              participant={tile.participant}
              streamType={VideoStreamType.Camera}
              fillMode={tileRole === 'stage' ? FillMode.Fit : FillMode.Fill}
              lazyLoad={{ enable: false }}
            >
              {CustomUI
                ? <CustomUI participant={tile.participant} streamType={VideoStreamType.Camera} />
                : (
                  <div className="edu-tile-mobile-overlay">
                    {!tile.cameraOn && (
                      <div className="edu-tile-mobile-mask">
                        <div className="edu-tile-mobile-face">
                          <TUIAvatar src={tile.avatarUrl} alt={tile.name} size={faceSize} />
                        </div>
                      </div>
                    )}

                    {tile.weakNetwork && (
                      <span className="edu-tile-mobile-net" aria-label={t('Education.WeakNetwork')}>
                        <IconNet size={12} />
                      </span>
                    )}

                    {tile.trophyCount > 0 && (
                      <span className="edu-tile-mobile-trophy">
                        <IconTrophyUi size={10} />
                        <b>
                          ×
                          {tile.trophyCount}
                        </b>
                      </span>
                    )}

                    <div className="edu-tile-mobile-meta">
                      <span className="edu-tile-mobile-mic" aria-label={t(tile.micOn ? 'Education.MicOn' : 'Education.MicOff')}>
                        {tile.micOn ? <IconMic size={12} /> : <IconMicOff size={12} />}
                        {isSpeaking && (
                          <svg
                            className="edu-tile-mobile-mic-core"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                            style={{ clipPath: `inset(${waveInset}% 0 0 0)` }}
                          >
                            <rect x="5.5" y="2" width="5" height="8.5" rx="2.5" />
                          </svg>
                        )}
                      </span>
                      <span className="edu-tile-mobile-name">{tile.name}</span>
                      {tile.seat === 'teacher' && <em className="edu-tile-mobile-tag">{t('Education.Teacher')}</em>}
                    </div>
                  </div>
                )}
            </RoomParticipantView>
          </div>
        )
        : (
          <div className="edu-tile-mobile-wait">
            <img className="edu-tile-mobile-wait-figure" src={tile.seat === 'teacher' ? waitTeacher : waitStudent} alt="" draggable={false} />
            <span className="edu-tile-mobile-wait-label">
              {t('Education.Coming', { name: t(tile.seat === 'teacher' ? 'Education.Teacher' : 'Education.Student') })}
            </span>
          </div>
        )}
    </div>
  );
}

export default ParticipantTileEduMobile;
