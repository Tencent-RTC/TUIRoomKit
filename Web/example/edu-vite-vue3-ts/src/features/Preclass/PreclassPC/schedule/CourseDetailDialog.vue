<template>
  <TUIDialog
    :open="open"
    :title="t('Preclass.DetailTitle')"
    width="420px"
    confirm-text=""
    cancel-text=""
    closable
    :close-on-overlay="true"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="course" class="preclass-detail-card">
      <div v-for="row in rows" :key="row.key" class="preclass-detail-row">
        <div class="preclass-detail-label">
          {{ row.label }}
        </div>
        <div class="preclass-detail-value-row">
          <div class="preclass-detail-value" :class="{ 'is-clamped': row.key === 'members' }">
            {{ row.value }}
          </div>
          <button
            v-if="row.copyLabel"
            type="button"
            class="preclass-detail-copy"
            :class="{ 'is-copied': copied === row.key }"
            :aria-label="row.copyLabel"
            @click="copy(row.key, row.value)"
          >
            <IconCheck v-if="copied === row.key" :size="14" />
            <IconCopy v-else :size="14" />
          </button>
        </div>
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { IconCheck, IconCopy, TUIDialog, t } from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact } from '@tencentcloud/roomkit-web-vue3';
import { useCopyFeedback } from './courseCopy';
import { browserTimezoneLabel, formatRange } from './scheduleTime';
import type { ClassCourse } from './useClassSchedule';

const props = defineProps<{
  open: boolean;
  course?: ClassCourse;
  link: string;
  attendees: PickedContact[];
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const { copied, copy, reset } = useCopyFeedback();

watch(() => props.open, (open) => {
  if (!open) reset();
});

const rows = computed(() => {
  const { course } = props;
  if (!course) return [];
  const names = props.attendees.map(user => user.userName).join(t('Schedule.NameSep'));
  return [
    { key: 'name', label: t('Preclass.RoomName'), value: course.title },
    { key: 'teacher', label: t('Preclass.Teacher'), value: course.teacherName },
    { key: 'time', label: t('Preclass.ShareTime'), value: formatRange(course.start, course.end) },
    {
      key: 'duration',
      label: t('Preclass.Duration'),
      value: t('Preclass.Minutes', { n: Math.round((course.end - course.start) / 60) }),
    },
    { key: 'timezone', label: t('Preclass.Timezone'), value: browserTimezoneLabel() },
    { key: 'mode', label: t('Preclass.ClassMode'), value: t('Preclass.ClassModeOneOnOne') },
    {
      key: 'members',
      label: t('Preclass.Members'),
      value: `${names || '—'}  ${t('Schedule.AttendeeCount', { count: props.attendees.length })}`,
    },
    { key: 'room', label: t('Preclass.RoomId'), value: course.roomId, copyLabel: t('Preclass.CopyRoomId') },
    { key: 'link', label: t('Preclass.ShareLink'), value: props.link, copyLabel: t('Preclass.CopyLink') },
  ];
});
</script>

<style scoped lang="scss">
.preclass-detail-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 10px 0;
  font-size: 14px;
}

.preclass-detail-label {
  flex: none;
  width: 72px;
  padding-top: 2px;
  color: var(--rk-text-tertiary);
}

.preclass-detail-value-row {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.preclass-detail-value {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  color: var(--rk-text-primary);
  word-break: break-all;
}

.preclass-detail-value.is-clamped {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.preclass-detail-copy {
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

.preclass-detail-copy:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.preclass-detail-copy.is-copied {
  color: var(--rk-brand);
}
</style>

<!-- The dialog shell is teleported, so its footer has to be hidden from outside the scope. -->
<style lang="scss">
.rk-dialog-mask .rk-dialog:has(.preclass-detail-card) .rk-dialog-footer {
  display: none;
}
</style>
