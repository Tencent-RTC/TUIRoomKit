import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  IconClose,
  IconMembers,
  IconSearch,
  IconSearchEmpty,
  TUIAvatar,
  TUIDialog,
  TUIInput,
  TUIList,
  TUISwitch,
  useI18n,
} from '../../base';
import {
  DeviceStatus,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';
import { readTrophyCount } from '../EduTools/Trophy/trophyActions';
import {
  matchesParticipantQuery,
  participantDisplayName,
  useParticipantAutoLoad,
  useParticipantPermission,
  useRoomControls,
} from '../Participants/participantData';
import EduRosterRow from './EduRosterRow';
import { useRoomControlActions } from '../Participants/participantActions';
import type { EduRosterColumnKey, EduRosterRowData } from './EduRosterRow';
import './EduRoster.scss';
import './EduRoster.global.scss';

/**
 * EDU 1v1 class roster dialog, from the interaction design
 * (ClassRoster-edu). Only the education scene uses it, so the roster logic
 * lives here in the components instead of the shared participants data
 * layer: this file owns the member source, search, sorting
 * and the footer; the row component owns its own cell states. Shared
 * member-domain pieces (list loading, permissions, display names, search
 * matching) are imported from the participants data layer.
 *
 * The shell is TUIDialog with its spacing zeroed (EduRoster.global.scss) so the
 * content owns the whole panel; the body is tools + fixed header row + TUIList for
 * the scrolling rows.
 */

export interface EduRosterProps {
  open: boolean;
  showMuteAll?: boolean;
  onUpdateOpen?: (open: boolean) => void;
}

type EduRosterSortKey = 'name' | 'trophy';

export function EduRoster(props: EduRosterProps) {
  const { open, onUpdateOpen } = props;
  const { t, language } = useI18n();

  function onOpenChange(next: boolean): void {
    onUpdateOpen?.(next);
  }

  useParticipantAutoLoad();
  const { currentRoom } = useRoomState();
  const { localParticipant, participantList } = useRoomParticipantState();
  const { microphoneStatus, cameraStatus } = useDeviceState();
  const { isLocal, isRoomOwner, canManageMembers } = useParticipantPermission();
  const { microphoneControl } = useRoomControls();
  const { toggleAllMicrophone } = useRoomControlActions({ education: true });

  /** In the 1v1 classroom the room owner is the teacher. */
  const viewerIsTeacher = isRoomOwner;

  /**
   * 1v1 columns from ClassRoster-edu: whiteboard auth, then devices and trophy.
   * Mute and remove stay on the teacher view.
   */
  const columns: EduRosterColumnKey[] = viewerIsTeacher
    ? ['board', 'mic', 'cam', 'trophy', 'mute', 'kick']
    : ['board', 'mic', 'cam', 'trophy'];

  // Search and sorting, driven by the header carets.
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortKey, setSortKey] = useState<EduRosterSortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  /** Switch column on caret click, or flip direction when the header is clicked. */
  function setSort(key: EduRosterSortKey, direction?: 'asc' | 'desc') {
    if (direction === 'asc' || direction === 'desc') {
      setSortKey(key);
      setSortAsc(direction === 'asc');
      return;
    }
    if (sortKey === key) {
      setSortAsc(!sortAsc);
      return;
    }
    setSortKey(key);
    // The trophy list reads best from most awards down.
    setSortAsc(key !== 'trophy');
  }

  /** The room owner (teacher) is pinned on top; students follow below. */
  const teacherId = currentRoom?.roomOwner?.userId ?? '';
  const members = useMemo(() => {
    const others = participantList.filter(item => item.userId !== localParticipant?.userId);
    return localParticipant ? [localParticipant, ...others] : others;
  }, [localParticipant, participantList]);

  function compareMembers(left: RoomParticipant, right: RoomParticipant): number {
    let result = 0;
    if (sortKey === 'trophy') {
      result = readTrophyCount(left) - readTrophyCount(right);
    }
    if (!result) {
      result = participantDisplayName(left).localeCompare(participantDisplayName(right), 'zh');
    }
    return sortAsc ? result : -result;
  }

  const toRow = (participant: RoomParticipant, isTeacher = false): EduRosterRowData => {
    const isSelf = isLocal(participant);
    return {
      participant,
      name: participantDisplayName(participant),
      isSelf,
      isTeacher,
      trophyCount: readTrophyCount(participant),
      isMicOn: (isSelf ? microphoneStatus : participant.microphoneStatus) === DeviceStatus.On,
      isCamOn: (isSelf ? cameraStatus : participant.cameraStatus) === DeviceStatus.On,
    };
  };
  const studentRows = members
    .filter(item => item.userId !== teacherId)
    .filter(participant => matchesParticipantQuery(participant, searchKeyword))
    .sort(compareMembers)
    .map(participant => toRow(participant));
  // The teacher stays pinned first and is exempt from the column sorting.
  const teacherParticipant = members.find(item => item.userId === teacherId);
  const teacherRows = teacherParticipant && matchesParticipantQuery(teacherParticipant, searchKeyword)
    ? [toRow(teacherParticipant, true)]
    : [];
  const rows = [...teacherRows, ...studentRows];

  const isSearchEmpty = Boolean(searchKeyword.trim()) && rows.length === 0;

  /** Split the description around the query so the keyword can be marked without innerHTML. */
  const searchEmptyCopy = (() => {
    const query = searchKeyword.trim();
    const marker = '\u0000';
    const text = t('Participants.SearchEmptyDesc', { query: marker });
    const splitAt = text.indexOf(marker);
    if (splitAt < 0) {
      return { before: text, query, after: '' };
    }
    return {
      before: text.slice(0, splitAt),
      query,
      after: text.slice(splitAt + marker.length),
    };
  })();
  /* Everyone in the roster is online, so both figures come from the same count;
     the design's tab shows the online/total pair (ClassRoster-edu __count). */
  const joinedCount = members.length;
  const joinedCountLabel = `(${joinedCount}/${joinedCount})`;
  const attendanceLabel = t('Education.Roster.Attendance', { online: joinedCount, total: joinedCount });

  /** Footer: the room owner record carries name and avatar. */
  const teacher = {
    name: currentRoom?.roomOwner?.userName || currentRoom?.roomOwner?.userId || '',
    avatarUrl: currentRoom?.roomOwner?.avatarUrl || '',
  };

  function columnLabel(column: EduRosterColumnKey): string {
    switch (column) {
      case 'mic':
        return t('Education.Roster.Microphone');
      case 'cam':
        return t('Education.Roster.Camera');
      case 'trophy':
        return t('Education.Roster.Trophy');
      case 'board':
        return t('Education.Roster.Authorize');
      case 'mute':
        return t('Education.Roster.Mute');
      case 'kick':
        return t('Education.Roster.Remove');
      default:
        return column;
    }
  }

  return (
    <TUIDialog
      open={open}
      width="min(860px, calc(100vw - 40px))"
      confirmText=""
      cancelText=""
      onUpdateOpen={onOpenChange}
      headerSlot={(
        <div className="edu-roster-head">
          <h2 className="edu-roster-title">
            {t('Education.Roster.Title')}
          </h2>
          <button
            className="edu-roster-close"
            type="button"
            aria-label={t('Education.Roster.Close')}
            onClick={() => onOpenChange(false)}
          >
            <IconClose size={12} />
          </button>
        </div>
      )}
      footerSlot={(
        <div className="edu-roster-foot">
          <TUIAvatar className="edu-roster-foot-avatar" src={teacher.avatarUrl} alt={teacher.name} size={24} />
          <span className="edu-roster-foot-attend">{attendanceLabel}</span>
          {props.showMuteAll && canManageMembers && (
            <label className="edu-roster-mute-all">
              <span>{t('Participants.MuteAll')}</span>
              <TUISwitch size="sm" modelValue={microphoneControl.active} aria-label={t('Participants.MuteAll')} onChange={toggleAllMicrophone} />
            </label>
          )}
        </div>
      )}
    >
      <div className={`edu-roster-body${language.toLowerCase().startsWith('zh') ? '' : ' is-en'}`} style={{ '--edu-roster-cols': String(columns.length) } as CSSProperties}>
        <div className="edu-roster-tools">
          <span className="edu-roster-tab">
            {t('Education.Roster.Members')}
            <em className="edu-roster-count">{joinedCountLabel}</em>
          </span>
          <TUIInput
            modelValue={searchKeyword}
            className="edu-roster-search"
            size="sm"
            placeholder={t('Education.Roster.Search')}
            clearable
            onUpdateModelValue={value => setSearchKeyword(String(value ?? ''))}
            prefixSlot={<IconSearch size={13} />}
          />
        </div>

        <div className="edu-roster-table">
          <div className="edu-roster-row is-head">
            <button
              className={['edu-roster-sort', sortKey === 'name' ? 'is-active' : ''].filter(Boolean).join(' ')}
              type="button"
              onClick={() => setSort('name')}
            >
              {t('Education.Roster.Members')}
            </button>
            {columns.map(column => (column !== 'trophy'
              ? <span key={column} className="edu-roster-head-cell">{columnLabel(column)}</span>
              : (
                <span
                  key={column}
                  className={['edu-roster-sort-wrap', sortKey === 'trophy' ? 'is-active' : ''].filter(Boolean).join(' ')}
                >
                  <button
                    className={['edu-roster-sort', sortKey === 'trophy' ? 'is-active' : ''].filter(Boolean).join(' ')}
                    type="button"
                    onClick={() => setSort('trophy')}
                  >
                    {columnLabel(column)}
                  </button>
                  <span className="edu-roster-sort-carets">
                    <button
                      className={['edu-roster-sort-caret', sortKey === 'trophy' && sortAsc ? 'is-on' : ''].filter(Boolean).join(' ')}
                      type="button"
                      aria-label={t('Education.Roster.SortAsc', { label: columnLabel(column) })}
                      onClick={() => setSort('trophy', 'asc')}
                    />
                    <button
                      className={['edu-roster-sort-caret is-desc', sortKey === 'trophy' && !sortAsc ? 'is-on' : ''].filter(Boolean).join(' ')}
                      type="button"
                      aria-label={t('Education.Roster.SortDesc', { label: columnLabel(column) })}
                      onClick={() => setSort('trophy', 'desc')}
                    />
                  </span>
                </span>
              )))}
          </div>

          <TUIList
            className="edu-roster-list"
            variant="plain"
            height="100%"
            itemHeight={40}
            emptySlot={(
              <div className={['edu-roster-empty', isSearchEmpty ? 'is-search' : ''].filter(Boolean).join(' ')}>
                {isSearchEmpty
                  ? (
                    <>
                      <IconSearchEmpty className="edu-roster-empty-art" />
                      <div className="edu-roster-empty-title">
                        {t('Participants.SearchEmpty')}
                      </div>
                      <div className="edu-roster-empty-desc">
                        {searchEmptyCopy.before}
                        <mark>{searchEmptyCopy.query}</mark>
                        {searchEmptyCopy.after}
                      </div>
                      <button className="edu-roster-empty-clear" type="button" onClick={() => setSearchKeyword('')}>
                        {t('Participants.ClearSearch')}
                      </button>
                    </>
                  )
                  : (
                    <>
                      <IconMembers className="edu-roster-empty-icon" size={40} />
                      <span className="edu-roster-empty-text">{t('Participants.Empty')}</span>
                    </>
                  )}
              </div>
            )}
          >
            {rows.map(row => (
              <EduRosterRow
                key={row.participant.userId}
                row={row}
                columns={columns}
                viewerIsTeacher={viewerIsTeacher}
              />
            ))}
          </TUIList>
        </div>
      </div>
    </TUIDialog>
  );
}

export default EduRoster;
