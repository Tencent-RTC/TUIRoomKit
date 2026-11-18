import {
  IconBan,
  IconCam,
  IconCamOff,
  IconEduWhiteboardAuth,
  IconEduWhiteboardAuthOff,
  IconKick,
  IconMic,
  IconMicOff,
  IconTrophyUi,
  TUIAvatar,
  TUIToast,
  useI18n,
} from '../../base';
import { useRoomState } from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { EDU_CLASS_EVENT_ID, sendNotice } from '../Chat/customMessage';
import { useSendTrophy } from '../EduTools/Trophy/trophyActions';
import { useParticipantActions } from '../Participants/participantActions';
import { useParticipantMetaData, useWriteParticipantMetaData } from '../Participants/participantMetaData';
import { toastRoomError } from '../../utils/roomError';
import './EduRosterRow.scss';

/** Roster cell columns; each entry renders one cell after the name. */
export type EduRosterColumnKey = 'mic' | 'cam' | 'trophy' | 'board' | 'mute' | 'kick';

/**
 * Same member key as `classroomData.BOARD_AUTH_KEY`. The roster lives in
 * features and cannot import the education view that owns the constant.
 */
const BOARD_AUTH_KEY = 'edu.boardAuth';

/** One roster row, derived by the list from the participant. */
export interface EduRosterRowData {
  participant: RoomParticipant;
  name: string;
  isSelf: boolean;
  /** The room owner row, pinned on top; trophy/mute/kick stay locked on it. */
  isTeacher: boolean;
  trophyCount: number;
  isMicOn: boolean;
  isCamOn: boolean;
}

interface EduRosterCellData {
  /** Highlighted state of the cell icon (device on, muted, trophy ever given). */
  on: boolean;
  /** Rendered as a status span instead of a button: the viewer cannot act here. */
  locked: boolean;
  /** The tooltip text, also used as the aria-label. */
  title: string;
}

export interface EduRosterRowProps {
  row: EduRosterRowData;
  columns: EduRosterColumnKey[];
  /** The room owner is the teacher in the 1v1 classroom. */
  viewerIsTeacher: boolean;
}

/** Non-actionable columns on the teacher row render a plain dash instead of an icon */
const DASH_KEYS: EduRosterColumnKey[] = ['trophy', 'board', 'mute', 'kick'];

export function EduRosterRow(props: EduRosterRowProps) {
  const { row, columns, viewerIsTeacher } = props;
  const { t } = useI18n();
  const { toggleMic, toggleCam, toggleChat, kick } = useParticipantActions({ education: true });
  const { currentRoom } = useRoomState();
  const sendTrophy = useSendTrophy();
  const writeParticipantMetaData = useWriteParticipantMetaData();
  const readMetaData = useParticipantMetaData();

  const isMuted = Boolean(row.participant.isMessageDisabled);
  const boardAuthorized = readMetaData(row.participant)[BOARD_AUTH_KEY] === '1';

  function isDash(key: EduRosterColumnKey): boolean {
    return row.isTeacher && DASH_KEYS.includes(key);
  }

  /**
   * Cell states per column: device on, whether the viewer may act, and the
   * tooltip. The teacher acts on every listed row; a student acts only on
   * their own devices, everything else they see is locked status.
   */
  const { isSelf, isTeacher, trophyCount, isMicOn, isCamOn } = row;
  const mediaCell = (
    on: boolean,
    onTitle: string,
    offTitle: string,
    onHint: string,
    offHint: string,
  ): EduRosterCellData => (
    isSelf || viewerIsTeacher
      ? { on, locked: false, title: on ? onTitle : offTitle }
      : { on, locked: true, title: t(on ? onHint : offHint) }
  );
  const cells: Record<EduRosterColumnKey, EduRosterCellData> = {
    mic: mediaCell(
      isMicOn,
      t('Participants.MicClose'),
      t(viewerIsTeacher && !isSelf ? 'Education.Roster.RequestMic' : 'Participants.MicOpen'),
      'Participants.MicOnHint',
      'Participants.MicOffHint',
    ),
    cam: mediaCell(
      isCamOn,
      t('Participants.CamClose'),
      t(viewerIsTeacher && !isSelf ? 'Education.Roster.RequestCamera' : 'Participants.CamOpen'),
      'Participants.CamOnHint',
      'Participants.CamOffHint',
    ),
    trophy: viewerIsTeacher && !isTeacher
      ? { on: trophyCount > 0, locked: false, title: t('Education.Roster.GiveTrophy') }
      : { on: trophyCount > 0, locked: true, title: t('Education.Roster.Trophy') },
    board: {
      on: boardAuthorized,
      locked: !(viewerIsTeacher && !isTeacher),
      title: t(boardAuthorized ? 'Education.Roster.RevokeBoard' : 'Education.Roster.AuthorizeBoard'),
    },
    mute: {
      on: isMuted,
      locked: !(viewerIsTeacher && !isSelf) || isTeacher,
      title: t(isMuted ? 'Education.Roster.Unmute' : 'Education.Roster.Mute'),
    },
    kick: {
      on: false,
      locked: !(viewerIsTeacher && !isSelf) || isTeacher,
      title: t('Education.Roster.Remove'),
    },
  };

  /** Grants or revokes this student's whiteboard access. The teacher row never reaches here. */
  async function setBoardAuth(participant: RoomParticipant, name: string, authorized: boolean): Promise<void> {
    const next = authorized ? '0' : '1';
    try {
      await writeParticipantMetaData(participant.userId, { [BOARD_AUTH_KEY]: next });
      TUIToast.success(t(next === '1' ? 'Education.AuthOnTeacher' : 'Education.AuthOffTeacher', { name }));
      // Permission remains authoritative if the timeline notification fails.
      const roomId = currentRoom?.roomId;
      if (roomId) {
        void sendNotice(EDU_CLASS_EVENT_ID, roomId, next === '1' ? 'board-auth-on' : 'board-auth-off', {
          targetName: name,
        }).catch((error) => {
          console.error('[EduRoster] whiteboard notice failed:', error);
        });
      }
    } catch (error) {
      console.error('[EduRoster] whiteboard authorization failed:', error);
      toastRoomError(error, { fallback: 'Participants.ActionFailure.failed' });
    }
  }

  function onCellClick(key: EduRosterColumnKey): void {
    if (cells[key].locked) {
      return;
    }
    const { participant } = row;
    switch (key) {
      case 'mic':
        void toggleMic(participant);
        break;
      case 'cam':
        void toggleCam(participant);
        break;
      case 'trophy':
        void sendTrophy(participant);
        break;
      case 'board':
        void setBoardAuth(participant, row.name, cells.board.on);
        break;
      case 'mute':
        void toggleChat(participant);
        break;
      case 'kick':
        void kick(participant);
        break;
      default:
        break;
    }
  }

  function renderCellIcon(key: EduRosterColumnKey) {
    const { on } = cells[key];
    switch (key) {
      case 'mic':
        return on ? <IconMic size={16} /> : <IconMicOff size={16} />;
      case 'cam':
        return on ? <IconCam size={16} /> : <IconCamOff size={16} />;
      case 'trophy':
        return <IconTrophyUi size={16} />;
      case 'board':
        return on ? <IconEduWhiteboardAuth size={16} /> : <IconEduWhiteboardAuthOff size={16} />;
      case 'mute':
        return <IconBan size={16} />;
      case 'kick':
        return <IconKick size={16} />;
      default:
        return null;
    }
  }

  return (
    <div className={['edu-roster-row', row.isSelf ? 'is-me' : ''].filter(Boolean).join(' ')}>
      <div className="edu-roster-name">
        <TUIAvatar className="edu-roster-name-avatar" src={row.participant.avatarUrl} alt={row.name} size={28} />
        <span className="edu-roster-name-text">{row.name}</span>
        {row.isTeacher && <em className="edu-roster-tag is-teacher">{t('Education.Roster.Teacher')}</em>}
        {row.isSelf && <em className="edu-roster-tag is-me">{t('Participants.Me')}</em>}
      </div>
      {columns.map((key) => {
        const cell = cells[key];
        const className = ['edu-roster-cell', `is-${key}`, cell.on ? 'is-on' : ''].filter(Boolean).join(' ');
        const content = isDash(key)
          ? <span className="edu-roster-cell-dash" aria-hidden="true">–</span>
          : (
            <>
              {renderCellIcon(key)}
              {key === 'trophy' && row.trophyCount > 0 && (
                <small className="edu-roster-cell-badge">
                  {row.trophyCount}
                </small>
              )}
            </>
          );
        // A locked cell is a status display, not a control.
        return cell.locked
          ? (
            <span key={key} className={className} title={cell.title} aria-label={cell.title}>
              {content}
            </span>
          )
          : (
            <button
              key={key}
              className={className}
              type="button"
              title={cell.title}
              aria-label={cell.title}
              onClick={() => onCellClick(key)}
            >
              {content}
            </button>
          );
      })}
    </div>
  );
}

export default EduRosterRow;
