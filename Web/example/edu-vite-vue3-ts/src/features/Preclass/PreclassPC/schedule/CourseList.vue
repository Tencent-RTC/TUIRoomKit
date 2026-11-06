<template>
  <div class="preclass-list" :aria-label="t('Preclass.CourseList')" role="list">
    <div v-if="!courses.length && !isLoaded" class="preclass-list-empty" role="status">
      <TUILoading size="lg" />
    </div>
    <div v-else-if="!courses.length" class="preclass-list-empty">
      <IconCourseEmpty class="preclass-list-empty-art" />
      <span>{{ t('Preclass.ListEmpty') }}</span>
    </div>
    <CourseCard
      v-for="course in courses"
      :key="course.roomId"
      role="listitem"
      :course="course"
      :link="linkOf(course.roomId)"
      :can-manage="canManage"
      :is-focused="course.roomId === focusRoomId"
      :data-room-id="course.roomId"
      @join="emit('join', $event)"
      @open="emit('open', $event)"
      @more="(item, command) => emit('more', item, command)"
    />
  </div>
</template>

<script setup lang="ts">
import { IconCourseEmpty, TUILoading, t } from '@tencentcloud/roomkit-web-vue3';
import CourseCard from './CourseCard.vue';
import type { ClassCourse } from '../../types';
import type { CourseMoreCommand } from './useClassSchedule';

defineProps<{
  courses: ClassCourse[];
  canManage: boolean;
  isLoaded: boolean;
  linkOf: (roomId: string) => string;
  focusRoomId?: string;
}>();

const emit = defineEmits<{
  join: [roomId: string];
  open: [course: ClassCourse];
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
  line-height: 20px;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.preclass-list-empty-art {
  width: 120px;
  height: 96px;
}
</style>
