<template>
  <div class="edu-roster-row" :class="{ 'is-me': row.isSelf }">
    <div class="edu-roster-name">
      <TUIAvatar class="edu-roster-name-avatar" :src="row.participant.avatarUrl" :alt="row.name" :size="28" />
      <span class="edu-roster-name-text">{{ row.name }}</span>
      <em v-if="row.isTeacher" class="edu-roster-tag is-teacher">{{ t('Education.Roster.Teacher') }}</em>
      <em v-if="row.isSelf" class="edu-roster-tag is-me">{{ t('Participants.Me') }}</em>
    </div>
    <template v-for="key in columns" :key="key">
      <component
        :is="cells[key].locked ? 'span' : 'button'"
        class="edu-roster-cell"
        :class="[`is-${key}`, { 'is-on': cells[key].on }]"
        :type="cells[key].locked ? undefined : 'button'"
        :title="cells[key].title"
        :aria-label="cells[key].title"
        @click="onCellClick(key)"
      >
        <template v-if="isDash(key)">
          <span class="edu-roster-cell-dash" aria-hidden="true">–</span>
        </template>
        <template v-else>
          <IconMic v-if="key === 'mic' && cells[key].on" :size="16" />
          <IconMicOff v-else-if="key === 'mic'" :size="16" />
          <IconCam v-else-if="key === 'cam' && cells[key].on" :size="16" />
          <IconCamOff v-else-if="key === 'cam'" :size="16" />
          <IconTrophyUi v-else-if="key === 'trophy'" :size="16" />
          <IconEduWhiteboardAuth v-else-if="key === 'board' && cells[key].on" :size="16" />
          <IconEduWhiteboardAuthOff v-else-if="key === 'board'" :size="16" />
          <IconBan v-else-if="key === 'mute'" :size="16" />
          <IconKick v-else-if="key === 'kick'" :size="16" />
          <small v-if="key === 'trophy' && row.trophyCount" class="edu-roster-cell-badge">
            {{ row.trophyCount }}
          </small>
        </template>
      </component>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
  t,
} from '../../../base';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { EDU_CLASS_EVENT_ID, sendNotice } from '../../Chat/customMessage';
import { sendTrophy } from '../../EduTools/Trophy/trophyActions';
import { useParticipantActions } from '../../Participants/participantActions';
import { writeParticipantMetaData } from '../../Participants/participantMetaData';
import { toastRoomError } from '../../../utils/roomError';

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

const props = defineProps<{
  row: EduRosterRowData;
  columns: EduRosterColumnKey[];
  /** The room owner is the teacher in the onetoone classroom. */
  viewerIsTeacher: boolean;
}>();

const { toggleMic, toggleCam, toggleChat, kick } = useParticipantActions({ education: true });

const isMuted = computed(() => Boolean(props.row.participant.isMessageDisabled));
const boardAuthorized = computed(() => props.row.participant.metaData?.[BOARD_AUTH_KEY] === '1');

/** Non-actionable columns on the teacher row render a plain dash instead of an icon */
const DASH_KEYS: EduRosterColumnKey[] = ['trophy', 'board', 'mute', 'kick'];
function isDash(key: EduRosterColumnKey): boolean {
  return props.row.isTeacher && DASH_KEYS.includes(key);
}

/**
 * Cell states per column: device on, whether the viewer may act, and the
 * tooltip. The teacher acts on every listed row; a student acts only on
 * their own devices, everything else they see is locked status.
 */
const cells = computed<Record<EduRosterColumnKey, EduRosterCellData>>(() => {
  const { isSelf, isTeacher, trophyCount, isMicOn, isCamOn } = props.row;
  const authorized = boardAuthorized.value;
  const { viewerIsTeacher } = props;
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
  return {
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
      on: authorized,
      locked: !(viewerIsTeacher && !isTeacher),
      title: t(authorized ? 'Education.Roster.RevokeBoard' : 'Education.Roster.AuthorizeBoard'),
    },
    mute: {
      on: isMuted.value,
      locked: !(viewerIsTeacher && !isSelf) || isTeacher,
      title: t(isMuted.value ? 'Education.Roster.Unmute' : 'Education.Roster.Mute'),
    },
    kick: {
      on: false,
      locked: !(viewerIsTeacher && !isSelf) || isTeacher,
      title: t('Education.Roster.Remove'),
    },
  };
});

// Locked cells render as status spans, but the click listener is still
// attached to them, so the handler itself must not act on locked cells —
// e.g. a student clicking the read-only trophy would award it.
function onCellClick(key: EduRosterColumnKey): void {
  if (cells.value[key].locked) {
    return;
  }
  const { participant } = props.row;
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
      void setBoardAuth(participant, props.row.name, cells.value.board.on);
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

/** Grants or revokes this student's whiteboard access. The teacher row never reaches here. */
async function setBoardAuth(participant: RoomParticipant, name: string, authorized: boolean): Promise<void> {
  const next = authorized ? '0' : '1';
  try {
    await writeParticipantMetaData(participant.userId, { [BOARD_AUTH_KEY]: next });
    // The engine may not echo the writer's own change, so the cell and the
    // stage outline update from this copy.
    Object.assign(participant, {
      metaData: { ...(participant.metaData ?? {}), [BOARD_AUTH_KEY]: next },
    });
    TUIToast.success(t(next === '1' ? 'Education.AuthOnTeacher' : 'Education.AuthOffTeacher', { name }));
    // Fire-and-forget timeline line: a failed send drops the line, the
    // permission itself rides the student's metaData and stays authoritative.
    const { currentRoom } = useRoomState();
    const roomId = currentRoom.value?.roomId || '';
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
</script>

<style scoped lang="scss" src="./EduRosterRow.scss"></style>
