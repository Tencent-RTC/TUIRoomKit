<template>
  <TUIDialog
    :open="open"
    width="min(860px, calc(100vw - 40px))"
    height="min(68vh, 540px)"
    :style="bareStyle"
    :confirm-text="''"
    :cancel-text="''"
    @update:open="onOpenChange"
  >
    <template #header>
      <div class="edu-roster-head">
        <h2 class="edu-roster-title">
          {{ t('Education.Roster.Title') }}
        </h2>
        <button
          class="edu-roster-close"
          type="button"
          :aria-label="t('Education.Roster.Close')"
          @click="onOpenChange(false)"
        >
          <IconClose :size="12" />
        </button>
      </div>
    </template>

    <div class="edu-roster-body" :style="{ '--edu-roster-cols': String(columns.length) }">
      <div class="edu-roster-tools">
        <span class="edu-roster-tab">
          {{ t('Education.Roster.Members') }}
          <em class="edu-roster-count">{{ joinedCountLabel }}</em>
        </span>
        <TUIInput
          v-model="searchKeyword"
          class="edu-roster-search"
          size="sm"
          :placeholder="t('Education.Roster.Search')"
          clearable
        >
          <template #prefix>
            <IconSearch :size="13" />
          </template>
        </TUIInput>
      </div>

      <div class="edu-roster-table">
        <div class="edu-roster-row is-head">
          <button
            class="edu-roster-sort"
            :class="{ 'is-active': sortKey === 'name' }"
            type="button"
            @click="setSort('name')"
          >
            {{ t('Education.Roster.Members') }}
          </button>
          <template v-for="column in columns" :key="column">
            <span v-if="column !== 'trophy'" class="edu-roster-head-cell">{{ columnLabel(column) }}</span>
            <span v-else class="edu-roster-sort-wrap" :class="{ 'is-active': sortKey === 'trophy' }">
              <button
                class="edu-roster-sort"
                :class="{ 'is-active': sortKey === 'trophy' }"
                type="button"
                @click="setSort('trophy')"
              >
                {{ columnLabel(column) }}
              </button>
              <span class="edu-roster-sort-carets">
                <button
                  class="edu-roster-sort-caret"
                  :class="{ 'is-on': sortKey === 'trophy' && sortAsc }"
                  type="button"
                  :aria-label="t('Education.Roster.SortAsc', { label: columnLabel(column) })"
                  @click="setSort('trophy', 'asc')"
                />
                <button
                  class="edu-roster-sort-caret is-desc"
                  :class="{ 'is-on': sortKey === 'trophy' && !sortAsc }"
                  type="button"
                  :aria-label="t('Education.Roster.SortDesc', { label: columnLabel(column) })"
                  @click="setSort('trophy', 'desc')"
                />
              </span>
            </span>
          </template>
        </div>

        <TUIList
          class="edu-roster-list"
          variant="plain"
          height="100%"
          :item-height="40"
        >
          <template #empty>
            <div class="edu-roster-empty" :class="{ 'is-search': isSearchEmpty }">
              <template v-if="isSearchEmpty">
                <span class="edu-roster-empty-text">
                  {{ t('Participants.SearchEmptyDesc', { query: searchKeyword.trim() }) }}
                </span>
                <button class="edu-roster-empty-clear" type="button" @click="clearSearch">
                  {{ t('Participants.ClearSearch') }}
                </button>
              </template>
              <template v-else>
                <IconMembers class="edu-roster-empty-icon" :size="40" />
                <span class="edu-roster-empty-text">{{ t('Participants.Empty') }}</span>
              </template>
            </div>
          </template>
          <EduRosterRow
            v-for="row in rows"
            :key="row.participant.userId"
            :row="row"
            :columns="columns"
            :viewer-is-teacher="viewerIsTeacher"
          />
        </TUIList>
      </div>
    </div>

    <template #footer>
      <div class="edu-roster-foot">
        <TUIAvatar class="edu-roster-foot-avatar" :src="teacher.avatarUrl" :alt="teacher.name" :size="24" />
        <span class="edu-roster-foot-attend">{{ attendanceLabel }}</span>
      </div>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties } from 'vue';
import {
  IconClose,
  IconMembers,
  IconSearch,
  TUIAvatar,
  TUIDialog,
  TUIInput,
  TUIList,
  t,
} from '../../base';
import {
  DeviceStatus,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { readTrophyCount } from '../EduTools/Trophy/trophyActions';
import {
  matchesParticipantQuery,
  participantDisplayName,
  useParticipantAutoLoad,
  useParticipantPermission,
} from '../Participants/participantData';
import EduRosterRow from './EduRosterRow.vue';
import type { EduRosterColumnKey, EduRosterRowData } from './EduRosterRow.vue';

/**
 * EDU 1v1 class roster dialog, from the interaction design
 * (ClassRoster-edu). Only the education scene uses it, so the roster logic
 * lives here in the components instead of the shared participants data
 * layer: this file owns the member source, search, sorting
 * and the footer; the row component owns its own cell states. Shared
 * member-domain pieces (list loading, permissions, display names, search
 * matching) are imported from the participants data layer.
 *
 * The shell is TUIDialog with its spacing escape hatch zeroed so the content
 * owns the whole panel; the body is tools + fixed header row + TUIList for
 * the scrolling rows.
 */

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

/** Zero the dialog's built-in padding and gaps; slots own every pixel. */
const bareStyle: CSSProperties = {
  '--rk-dialog-padding': '0',
  '--rk-dialog-header-gap': '0',
  '--rk-dialog-footer-gap': '0',
};

function onOpenChange(open: boolean): void {
  emit('update:open', open);
}

useParticipantAutoLoad();
const { currentRoom } = useRoomState();
const { localParticipant, participantList } = useRoomParticipantState();
const { microphoneStatus, cameraStatus } = useDeviceState();
const { isLocal, isRoomOwner } = useParticipantPermission();

/** In the 1v1 classroom the room owner is the teacher. */
const viewerIsTeacher = isRoomOwner;

/** The teacher gets the manage-only columns (mute / kick); the student view keeps the read-only trophy. */
const columns = computed<EduRosterColumnKey[]>(() => (
  viewerIsTeacher.value ? ['mic', 'cam', 'trophy', 'mute', 'kick'] : ['mic', 'cam', 'trophy']
));

// Search and sorting, driven by the header carets.
const searchKeyword = ref('');
type EduRosterSortKey = 'name' | 'trophy';
const sortKey = ref<EduRosterSortKey>('name');
const sortAsc = ref(true);

/** Switch column on caret click, or flip direction when the header is clicked. */
function setSort(key: EduRosterSortKey, direction?: 'asc' | 'desc') {
  if (direction === 'asc' || direction === 'desc') {
    sortKey.value = key;
    sortAsc.value = direction === 'asc';
    return;
  }
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
    return;
  }
  sortKey.value = key;
  // The trophy list reads best from most awards down.
  sortAsc.value = key !== 'trophy';
}

/** The room owner (teacher) is pinned on top; students follow below. */
const teacherId = computed(() => currentRoom.value?.roomOwner?.userId ?? '');
const members = computed(() => {
  const local = localParticipant.value;
  const others = participantList.value.filter(item => item.userId !== local?.userId);
  return local ? [local, ...others] : others;
});
const teacherParticipant = computed(() =>
  members.value.find(item => item.userId === teacherId.value));
const students = computed(() => members.value.filter(item => item.userId !== teacherId.value));

function compareMembers(left: RoomParticipant, right: RoomParticipant): number {
  let result = 0;
  if (sortKey.value === 'trophy') {
    result = readTrophyCount(left) - readTrophyCount(right);
  }
  if (!result) {
    result = participantDisplayName(left).localeCompare(participantDisplayName(right), 'zh');
  }
  return sortAsc.value ? result : -result;
}

const rows = computed<EduRosterRowData[]>(() => {
  const toRow = (participant: RoomParticipant, isTeacher = false): EduRosterRowData => {
    const isSelf = isLocal(participant);
    return {
      participant,
      name: participantDisplayName(participant),
      isSelf,
      isTeacher,
      trophyCount: readTrophyCount(participant),
      isMicOn: (isSelf ? microphoneStatus.value : participant.microphoneStatus) === DeviceStatus.On,
      isCamOn: (isSelf ? cameraStatus.value : participant.cameraStatus) === DeviceStatus.On,
    };
  };
  const studentRows = students.value
    .filter(participant => matchesParticipantQuery(participant, searchKeyword.value))
    .sort(compareMembers)
    .map(participant => toRow(participant));
  // The teacher stays pinned first and is exempt from the column sorting.
  const teacher = teacherParticipant.value;
  const teacherRows = teacher && matchesParticipantQuery(teacher, searchKeyword.value)
    ? [toRow(teacher, true)]
    : [];
  return [...teacherRows, ...studentRows];
});

const isSearchEmpty = computed(() => Boolean(searchKeyword.value.trim()) && rows.value.length === 0);
const joinedCount = computed(() => members.value.length);
/* Everyone in the roster is online, so both figures come from the same count;
   the design's tab shows the online/total pair (ClassRoster-edu __count). */
const joinedCountLabel = computed(() => `(${joinedCount.value}/${joinedCount.value})`);
const attendanceLabel = computed(() => {
  // Everyone in the room is online, so both figures come from the same count.
  const count = members.value.length;
  return t('Education.Roster.Attendance', { online: count, total: count });
});

/** Footer: the room owner record carries name and avatar. */
const teacher = computed(() => ({
  name: currentRoom.value?.roomOwner?.userName || currentRoom.value?.roomOwner?.userId || '',
  avatarUrl: currentRoom.value?.roomOwner?.avatarUrl || '',
}));

function columnLabel(column: EduRosterColumnKey): string {
  switch (column) {
    case 'mic':
      return t('Education.Roster.Microphone');
    case 'cam':
      return t('Education.Roster.Camera');
    case 'trophy':
      return t('Education.Roster.Trophy');
    case 'mute':
      return t('Education.Roster.Mute');
    case 'kick':
      return t('Education.Roster.Remove');
    default:
      return column;
  }
}

function clearSearch(): void {
  searchKeyword.value = '';
}
</script>

<style scoped lang="scss" src="./EduRoster.scss"></style>
<style lang="scss" src="./EduRoster.global.scss"></style>
