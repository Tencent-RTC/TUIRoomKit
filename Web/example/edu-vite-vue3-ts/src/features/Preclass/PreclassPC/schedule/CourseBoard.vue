<template>
  <div class="preclass-board">
    <WeekStrip
      :selected="selectedDay"
      :marked-days="markedDays"
      :now="now"
      @select="selectedDay = dayStart($event)"
    />
    <CourseList
      :courses="dayCourses"
      :can-manage="canManage"
      :link-of="linkOf"
      :attendee-count-of="attendeeCountOf"
      @join="emit('join', $event)"
      @more="(course, command) => emit('more', course, command)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CourseList from './CourseList.vue';
import WeekStrip from './WeekStrip.vue';
import { dayStart, sameDay, toDateKey } from './scheduleTime';
import type { ClassCourse, CourseMoreCommand } from './useClassSchedule';

const props = defineProps<{
  courses: ClassCourse[];
  canManage: boolean;
  now: number;
  linkOf: (roomId: string) => string;
  attendeeCountOf: (roomId: string) => number | undefined;
}>();

const emit = defineEmits<{
  'join': [roomId: string];
  'more': [course: ClassCourse, command: CourseMoreCommand];
  /** Room ids of the classes shown for the selected day. */
  'visible-change': [roomIds: string[]];
}>();

const selectedDay = ref(dayStart(new Date(props.now)));

function startDate(course: ClassCourse): Date {
  return new Date(course.start * 1000);
}

const markedDays = computed(() => new Set(props.courses
  .map(course => toDateKey(startDate(course)))));
const dayCourses = computed(() => props.courses
  .filter(course => sameDay(startDate(course), selectedDay.value))
  .sort((a, b) => a.start - b.start));

// `courses` is rebuilt on every clock tick, so compare the id list instead of the array.
watch(() => dayCourses.value.map(course => course.roomId).join(','), () => {
  emit('visible-change', dayCourses.value.map(course => course.roomId));
}, { immediate: true });

function showDay(day: Date) {
  selectedDay.value = dayStart(day);
}

defineExpose({ showDay });
</script>

<style scoped lang="scss">
.preclass-board {
  display: grid;
  flex: 1 1 auto;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}
</style>
