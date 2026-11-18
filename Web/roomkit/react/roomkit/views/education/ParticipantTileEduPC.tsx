import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useRoomParticipantState,
} from 'tuikit-atomicx-react/room';
import {
  IconCam,
  IconCamOff,
  IconEduWhiteboardAuth,
  IconEduWhiteboardAuthOff,
  IconMic,
  IconMicOff,
  IconNet,
  IconTrophyUi,
  TUIAvatar,
  useI18n,
  useUIConfig,
} from '../../base';
import { useClassroom } from './classroomData';
import type { TileData } from './classroomData';
import { useClassroomActions } from './classroomActions';
import waitStudent from './assets/wait-student.svg';
import waitTeacher from './assets/wait-teacher.svg';
import './ParticipantTileEduPC.scss';

export interface ParticipantTileEduPCProps {
  tile: TileData;
  /** `stage` fills the main area and letterboxes; `thumb` is the 16:9 rail seat. */
  tileRole: 'stage' | 'thumb';
  inStrip?: boolean;
  trophyLanding?: string;
}

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

export function ParticipantTileEduPC(props: ParticipantTileEduPCProps) {
  const { tile, tileRole } = props;
  const { t } = useI18n();
  const { uiConfig } = useUIConfig();
  const { isTeacher } = useClassroom();
  const actions = useClassroomActions();
  const { speakingUsers, localParticipant } = useRoomParticipantState();

  const CustomUI = uiConfig.participantViewUI;
  const showActions = isTeacher && tile.seat === 'student';
  const faceSize = props.inStrip ? 28 : ({ stage: 120, thumb: 72 }[tileRole]);

  const userId = tile.participant?.userId;
  let volume = 0;
  if (userId) {
    const reported = speakingUsers.get(userId) ?? 0;
    // The engine reports the local user under "", so a self tile misses its own level.
    volume = userId !== localParticipant?.userId ? reported : Math.max(reported, speakingUsers.get('') ?? 0);
  }

  /** Engine reports 0 when silent, so any positive volume counts as speaking. */
  const isSpeaking = tile.micOn && volume > 0;

  /** How much of the fill is cut away from the top; the rest reads as the level. */
  const level = Math.min(volume / SPEECH_PEAK, 1);
  const waveInset = ((1 - (WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level)) * 100).toFixed(1);

  const boardAuthLabel = t(tile.boardAuthorized ? 'Education.RevokeBoard' : 'Education.AuthorizeBoard');
  const micLabel = t(tile.micOn ? 'Participants.MicClose' : 'Education.RequestMic');
  const camLabel = t(tile.cameraOn ? 'Participants.CamClose' : 'Education.RequestCamera');

  return (
    <div
      className={['edu-tile', tile.participant ? '' : 'is-waiting', isSpeaking ? 'is-speaking' : ''].filter(Boolean).join(' ')}
      data-tile-role={tileRole}
      data-trophy-landing={props.trophyLanding}
    >
      {tile.participant
        ? (
          <div className="edu-tile-view">
            <RoomParticipantView
              participant={tile.participant}
              streamType={VideoStreamType.Camera}
              fillMode={tileRole === 'stage' ? FillMode.Fit : FillMode.Fill}
              lazyLoad={{ enable: false }}
            >
              {CustomUI
                ? <CustomUI participant={tile.participant} streamType={VideoStreamType.Camera} />
                : (
                  <div className="edu-tile-overlay">
                    {!tile.cameraOn && (
                      <div className="edu-tile-mask">
                        <div className="edu-tile-face">
                          <TUIAvatar src={tile.avatarUrl} alt={tile.name} size={faceSize} />
                        </div>
                      </div>
                    )}

                    {tile.weakNetwork && (
                      <span className="edu-tile-net" aria-label={t('Education.WeakNetwork')}>
                        <IconNet size={12} />
                      </span>
                    )}

                    {tile.trophyCount > 0 && (
                      <span className="edu-tile-trophy">
                        <IconTrophyUi size={10} />
                        <b>
                          ×
                          {tile.trophyCount}
                        </b>
                      </span>
                    )}

                    <div className="edu-tile-meta">
                      <span className="edu-tile-mic" aria-label={t(tile.micOn ? 'Education.MicOn' : 'Education.MicOff')}>
                        {tile.micOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
                        {isSpeaking && (
                          <span className="edu-tile-mic-core" style={{ clipPath: `inset(${waveInset}% 0 0 0)` }} />
                        )}
                      </span>
                      <span className="edu-tile-name">{tile.name}</span>
                      {tile.seat === 'teacher' && <em className="edu-tile-tag">{t('Education.Teacher')}</em>}
                    </div>

                    {showActions && (
                      <div className="edu-tile-actions">
                        <button
                          type="button"
                          className={tile.boardAuthorized ? 'is-on' : undefined}
                          aria-label={boardAuthLabel}
                          title={boardAuthLabel}
                          onClick={() => actions.toggleBoardAuth(tile)}
                        >
                          {tile.boardAuthorized ? <IconEduWhiteboardAuth size={14} /> : <IconEduWhiteboardAuthOff size={14} />}
                        </button>
                        <button
                          type="button"
                          aria-label={t('Education.GiveTrophy')}
                          title={t('Education.GiveTrophy')}
                          onClick={() => actions.reward(tile)}
                        >
                          <IconTrophyUi size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={micLabel}
                          title={micLabel}
                          onClick={() => actions.toggleMic(tile)}
                        >
                          {tile.micOn ? <IconMic size={14} /> : <IconMicOff size={14} />}
                        </button>
                        <button
                          type="button"
                          aria-label={camLabel}
                          title={camLabel}
                          onClick={() => actions.toggleCam(tile)}
                        >
                          {tile.cameraOn ? <IconCam size={14} /> : <IconCamOff size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </RoomParticipantView>
          </div>
        )
        : (
          <div className="edu-tile-wait">
            <img className="edu-tile-wait-figure" src={tile.seat === 'teacher' ? waitTeacher : waitStudent} alt="" draggable={false} />
            <span className="edu-tile-wait-label">
              {t('Education.Coming', { name: t(tile.seat === 'teacher' ? 'Education.Teacher' : 'Education.Student') })}
            </span>
          </div>
        )}
    </div>
  );
}

export default ParticipantTileEduPC;
