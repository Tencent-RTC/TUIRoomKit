<template>
  <article class="preclass-course" :class="{ 'is-live': live }">
    <div class="preclass-course-when">
      <span class="preclass-course-mode is-1v1">{{ t('Preclass.ClassModeOneOnOne') }}</span>
      <b class="preclass-course-start">{{ formatClock(course.start) }}</b>
      <span class="preclass-course-end">{{ formatClock(course.end) }}</span>
    </div>
    <div class="preclass-course-main">
      <div class="preclass-course-head">
        <h3 class="preclass-course-title">
          {{ course.title }}
        </h3>
        <em class="preclass-course-status" :class="{ 'is-live': live }">
          {{ t(live ? 'Preclass.StatusLive' : 'Preclass.StatusIdle') }}
        </em>
        <span v-if="canManage && course.isMine" class="preclass-course-more">
          <CourseMoreMenu :live="live" @command="emit('more', course, $event)" />
        </span>
      </div>
      <p class="preclass-course-sub">
        <span>{{ t('Preclass.Minutes', { n: Math.round((course.end - course.start) / 60) }) }}</span>
        <span class="preclass-course-id">
          {{ t('Preclass.RoomId') }} {{ course.roomId }}
          <button
            type="button"
            class="preclass-copy"
            :class="{ 'is-copied': copied === 'room' }"
            :aria-label="t('Preclass.CopyRoomId')"
            @click="copy('room', course.roomId)"
          >
            <IconCheck v-if="copied === 'room'" :size="14" />
            <IconCopy v-else :size="14" />
          </button>
        </span>
      </p>
      <div class="preclass-course-foot">
        <span class="preclass-course-person">
          <i class="preclass-course-avatar">{{ course.teacherName.slice(0, 1) }}</i>
          <span>{{ course.teacherName }}</span>
        </span>
        <span class="preclass-course-person">
          <IconMembers :size="16" />
          <span>
            {{ t('Preclass.Student') }}
            {{ attendeeCount === undefined ? '—' : t('Schedule.AttendeeCount', { count: attendeeCount }) }}
          </span>
        </span>
        <div class="preclass-course-ops">
          <TUIButton
            class="preclass-course-op"
            variant="secondary"
            @click="copy('invite', inviteText(course, link))"
          >
            {{ copied === 'invite' ? t('Preclass.Copied') : t('Preclass.CopyInvite') }}
          </TUIButton>
          <TUIButton
            class="preclass-course-op"
            :variant="live ? 'primary' : 'secondary'"
            @click="emit('join', course.roomId)"
          >
            {{ t('Preclass.EnterClass') }}
          </TUIButton>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconCheck, IconCopy, IconMembers, TUIButton, t } from '@tencentcloud/roomkit-web-vue3';
import CourseMoreMenu from './CourseMoreMenu.vue';
import { inviteText, useCopyFeedback } from './courseCopy';
import { formatClock } from './scheduleTime';
import type { ClassCourse, CourseMoreCommand } from './useClassSchedule';

const props = defineProps<{
  course: ClassCourse;
  link: string;
  canManage: boolean;
  /** Undefined while the roster is loading. */
  attendeeCount?: number;
}>();

const emit = defineEmits<{
  join: [roomId: string];
  more: [course: ClassCourse, command: CourseMoreCommand];
}>();

const { copied, copy } = useCopyFeedback();

const live = computed(() => props.course.status === 'live');
</script>

<style scoped lang="scss">
.preclass-course {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
  background: var(--pre-fill);
  border-radius: 14px;
  transition: background 0.15s;
}

.preclass-course:hover {
  background: var(--pre-fill-hover);
}

.preclass-course-when {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  font-variant-numeric: tabular-nums;
  background: color-mix(in srgb, var(--rk-text-primary) 5%, transparent);
  border-radius: 10px;
}

.preclass-course.is-live .preclass-course-when {
  background: color-mix(in srgb, var(--rk-brand) 14%, transparent);
}

.preclass-course-mode {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  margin-bottom: 6px;
  font-size: 10px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: 0.02em;
  border-radius: 4px;
}

.preclass-course-mode.is-1v1 {
  color: var(--rk-orange-500);
  background: color-mix(in srgb, var(--rk-orange-500) 14%, transparent);
}

.preclass-course-start {
  font-size: 18px;
  font-weight: 650;
  line-height: 22px;
  color: var(--rk-text-primary);
}

.preclass-course-end {
  font-size: 12px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.preclass-course-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 2px 0;
}

.preclass-course-head {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.preclass-course-title {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-course-status {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-style: normal;
  color: var(--rk-text-tertiary);
}

.preclass-course-status.is-live {
  color: var(--rk-brand);
}

.preclass-course-status.is-live::before {
  width: 6px;
  height: 6px;
  content: '';
  background: var(--rk-brand);
  border-radius: 50%;
  animation: preclass-live-pulse 1.6s ease-out infinite;
}

@keyframes preclass-live-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--rk-brand) 55%, transparent);
  }

  70%,
  100% {
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--rk-brand) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .preclass-course-status.is-live::before {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--rk-brand) 22%, transparent);
    animation: none;
  }
}

.preclass-course-more {
  display: inline-flex;
  flex: none;
  margin: -4px -4px -4px auto;
}

.preclass-course-sub {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--rk-text-tertiary);
}

.preclass-course-sub > span:not(:last-child)::after {
  margin: 0 8px;
  content: '·';
  opacity: 0.6;
}

.preclass-course-id {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.preclass-copy {
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.preclass-copy:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.preclass-copy.is-copied {
  color: var(--rk-brand);
}

.preclass-course-foot {
  display: flex;
  gap: 16px;
  align-items: center;
  padding-top: 8px;
  margin-top: auto;
}

.preclass-course-person {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--rk-text-secondary);
  white-space: nowrap;
}

.preclass-course-person > svg {
  flex: none;
  color: var(--rk-text-tertiary);
}

.preclass-course-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 18%, transparent);
  border-radius: 50%;
}

.preclass-course-ops {
  display: flex;
  flex: none;
  gap: 8px;
  margin-left: auto;
}

.rk-btn.preclass-course-op {
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  border: 0;
  border-radius: 9px;
  transition: background 0.15s, filter 0.15s;
}

.rk-btn-secondary.preclass-course-op {
  background: var(--pre-fill-hover);
}

.rk-btn-secondary.preclass-course-op:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rk-text-primary) 13%, transparent);
}

.rk-btn-primary.preclass-course-op {
  font-weight: 600;
}

.rk-btn-primary.preclass-course-op:hover:not(:disabled) {
  background: var(--rk-brand);
  filter: brightness(1.08);
}
</style>
