<template>
  <TUIDialog
    :open="open"
    :width="hasNoAttendees ? '600px' : '860px'"
    :style="DIALOG_STYLE"
    confirm-text=""
    cancel-text=""
    :close-on-overlay="true"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <TUIButton
        class="preclass-detail-close"
        variant="ghost"
        size="sm"
        :icon="IconClose"
        aria-label="Close"
        @click="emit('update:open', false)"
      />
    </template>
    <div v-if="course" class="preclass-detail" :class="{ 'is-solo': hasNoAttendees }">
      <div class="preclass-detail-main">
        <div class="preclass-detail-tags">
          <span class="preclass-detail-tag">{{ t('Preclass.ClassModeOneOnOne') }}</span>
          <span class="preclass-detail-status" :class="{ 'is-live': isLive }">
            {{ t(isLive ? 'Preclass.StatusLive' : 'Preclass.StatusIdle') }}
          </span>
        </div>
        <h3 class="preclass-detail-title">
          {{ course.title }}
        </h3>
        <div class="preclass-detail-when">
          <b>{{ formatRange(course.start, course.end) }}</b>
          <span> · {{ t('Preclass.Minutes', { n: minutes }) }} · {{ browserTimezoneLabel() }}</span>
        </div>

        <div class="preclass-detail-people">
          <div class="preclass-detail-kv">
            <span class="preclass-detail-label">{{ t('Preclass.Teacher') }}</span>
            <span class="preclass-detail-person">
              <TUIAvatar :size="32" :alt="course.teacherName" />
              <span>{{ course.teacherName }}</span>
            </span>
          </div>
        </div>
        <div class="preclass-detail-info">
          <div v-for="row in copyRows" :key="row.key" class="preclass-detail-kv">
            <span class="preclass-detail-label">{{ row.label }}</span>
            <span class="preclass-detail-value">{{ row.value }}</span>
            <TUIButton
              class="preclass-detail-copy"
              :class="{ 'is-copied': copied === row.key }"
              variant="ghost"
              size="sm"
              :icon="copied === row.key ? IconCheck : IconCopy"
              :aria-label="row.copyLabel"
              @click="copy(row.key, row.value)"
            />
          </div>
        </div>

        <div class="preclass-detail-foot">
          <TUIButton @click="copy('invite', inviteText(course, link))">
            {{ copied === 'invite' ? t('Preclass.Copied') : t('Preclass.CopyInvite') }}
          </TUIButton>
          <TUIButton variant="primary" @click="emit('join', course.roomId)">
            {{ t('Preclass.EnterClass') }}
          </TUIButton>
        </div>
      </div>

      <aside v-if="!hasNoAttendees" class="preclass-detail-side">
        <div class="preclass-detail-side-inner">
          <div class="preclass-detail-side-header">
            <span class="preclass-detail-side-title">{{ t('Preclass.Student') }}</span>
            <span class="preclass-detail-side-count">{{ t('Schedule.AttendeeCount', { count: attendees.length }) }}</span>
          </div>
          <TUIInput
            v-model="attendeeKeyword"
            class="preclass-detail-search"
            size="sm"
            clearable
            :placeholder="t('Participants.SearchPlaceholder')"
            @keydown.esc.stop="attendeeKeyword = ''"
          >
            <template #prefix>
              <IconSearch :size="15" />
            </template>
          </TUIInput>
          <div class="preclass-detail-member-list">
            <div v-for="user in filteredAttendees" :key="user.userId" class="preclass-detail-member" :title="user.userName">
              <TUIAvatar :size="28" :alt="user.userName" />
              <span>{{ user.userName }}</span>
            </div>
            <div v-if="!filteredAttendees.length" class="preclass-detail-member-empty">
              {{ t('Participants.SearchEmpty') }}
            </div>
          </div>
        </div>
      </aside>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconSearch,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact } from '@tencentcloud/roomkit-web-vue3';
import { inviteText, useCopyFeedback } from './courseCopy';
import { browserTimezoneLabel, formatRange } from './scheduleTime';
import type { ClassCourse } from '../../types';

const props = defineProps<{
  open: boolean;
  course?: ClassCourse;
  link: string;
  attendees: PickedContact[];
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'join': [roomId: string];
}>();

/** The close button floats over the content, so the shell's header and footer rows take no space. */
const DIALOG_STYLE = {
  '--rk-dialog-padding': '32px 36px 30px',
  '--rk-dialog-header-gap': '0',
  '--rk-dialog-footer-gap': '0',
};

const { copied, copy, reset } = useCopyFeedback();
const attendeeKeyword = ref('');

watch(() => props.open, (open) => {
  if (!open) {
    reset();
    attendeeKeyword.value = '';
  }
});

const isLive = computed(() => props.course?.status === 'live');
const hasNoAttendees = computed(() => !props.attendees.length);
const minutes = computed(() => (props.course ? Math.round((props.course.end - props.course.start) / 60) : 0));

const copyRows = computed(() => {
  const { course } = props;
  if (!course) return [];
  return [
    { key: 'room', label: t('Preclass.RoomId'), value: course.roomId, copyLabel: t('Preclass.CopyRoomId') },
    { key: 'link', label: t('Preclass.ShareLink'), value: props.link, copyLabel: t('Preclass.CopyLink') },
  ];
});

const filteredAttendees = computed(() => {
  const keyword = String(attendeeKeyword.value ?? '').trim().toLowerCase();
  if (!keyword) return props.attendees;
  return props.attendees.filter(user => user.userName.toLowerCase().includes(keyword));
});
</script>

<style scoped lang="scss">
.preclass-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  min-height: 480px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--rk-text-primary);
}

.preclass-detail.is-solo {
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
}

.preclass-detail-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-right: 32px;
}

.preclass-detail.is-solo .preclass-detail-main {
  padding-right: 0;
}

.preclass-detail-tags {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 26px;
  margin-right: 44px;
  font-size: 13px;
  line-height: 1;
}

.preclass-detail-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  font-weight: 500;
  color: var(--rk-orange-500);
  background: color-mix(in srgb, var(--rk-orange-500) 14%, transparent);
  border-radius: 7px;
}

.preclass-detail-status {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-weight: 600;
  color: var(--rk-text-tertiary);
}

.preclass-detail-status::before {
  width: 7px;
  height: 7px;
  content: '';
  background: currentcolor;
  border-radius: 50%;
  opacity: 0.7;
}

.preclass-detail-status.is-live {
  color: var(--rk-brand);
}

.preclass-detail-status.is-live::before {
  opacity: 1;
}

.preclass-detail-title {
  margin: 14px 0 8px;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.015em;
  word-break: break-word;
}

.preclass-detail-when {
  color: var(--rk-text-tertiary);
}

.preclass-detail-when b {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-secondary);
}

.preclass-detail-people,
.preclass-detail-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preclass-detail-people {
  padding-top: 18px;
  margin-top: 22px;
  border-top: 1px solid var(--rk-border);
}

.preclass-detail-info {
  margin-top: 6px;
}

.preclass-detail-kv {
  display: flex;
  gap: 16px;
  align-items: center;
  min-height: 44px;
}

.preclass-detail-label {
  flex: none;
  width: 80px;
  color: var(--rk-text-tertiary);
  white-space: nowrap;
}

.preclass-detail-person {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.preclass-detail-person > span,
.preclass-detail-value,
.preclass-detail-member span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-detail-value {
  flex: 1;
  min-width: 0;
  font-variant-numeric: tabular-nums;
}

.preclass-detail-copy {
  flex: none;
  width: var(--rk-control-sm);
  padding: 0;
  color: var(--rk-text-tertiary);
}

.preclass-detail-copy.is-copied {
  color: var(--rk-brand);
}

.preclass-detail-foot {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 28px;
  margin-top: auto;
}

/* The left column sets the height; the roster scrolls inside the right one. */
.preclass-detail-side {
  position: relative;
  border-left: 1px solid var(--rk-border);
}

.preclass-detail-side-inner {
  position: absolute;
  inset: 0 0 0 28px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preclass-detail-side-header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  min-height: 26px;
  margin-right: 44px;
}

.preclass-detail-side-title {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.preclass-detail-side-count {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-tertiary);
}

.preclass-detail-search {
  flex: none;
  margin-top: 14px;
  color: var(--rk-text-tertiary);
}

.preclass-detail-member-list {
  flex: 1;
  min-height: 0;
  padding: 0 8px;
  margin: 10px -8px 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.preclass-detail-member {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  height: 44px;
  padding: 0 8px;
  border-radius: 8px;
}

.preclass-detail-member:hover {
  background: var(--rk-bg-hover);
}

.preclass-detail-close {
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 1;
  width: var(--rk-control-sm);
  padding: 0;
  color: var(--rk-text-secondary);
}

.preclass-detail-member-empty {
  padding: 40px 0;
  color: var(--rk-text-tertiary);
  text-align: center;
}
</style>
