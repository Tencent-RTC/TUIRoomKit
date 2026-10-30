<template>
  <div class="preclass-list" :aria-label="t('Preclass.CourseList')" role="list">
    <div v-if="!courses.length" class="preclass-list-empty">
      <span class="preclass-list-empty-icon">
        <IconCalendar :size="18" />
      </span>
      <span>{{ t('Preclass.ListEmpty') }}</span>
    </div>
    <CourseCard
      v-for="course in courses"
      :key="course.roomId"
      role="listitem"
      :course="course"
      :link="linkOf(course.roomId)"
      :can-manage="canManage"
      :attendee-count="attendeeCountOf(course.roomId)"
      @join="emit('join', $event)"
      @more="(item, command) => emit('more', item, command)"
    />
  </div>
</template>

<script setup lang="ts">
import { IconCalendar, t } from '@tencentcloud/roomkit-web-vue3';
import CourseCard from './CourseCard.vue';
import type { ClassCourse, CourseMoreCommand } from './useClassSchedule';

defineProps<{
  courses: ClassCourse[];
  canManage: boolean;
  linkOf: (roomId: string) => string;
  attendeeCountOf: (roomId: string) => number | undefined;
}>();

const emit = defineEmits<{
  join: [roomId: string];
  more: [course: ClassCourse, command: CourseMoreCommand];
}>();
</script>

<style scoped lang="scss">
.preclass-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  padding: 14px 16px 16px;
  overflow: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.preclass-list-empty {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: 20px;
  margin: auto;
  font-size: 13px;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.preclass-list-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--rk-bg-raised);
  border-radius: 10px;
}
</style>
