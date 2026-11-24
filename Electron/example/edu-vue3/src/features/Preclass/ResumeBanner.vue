<template>
  <div class="preclass-resume" role="status">
    <span class="preclass-resume-dot" aria-hidden="true" />
    <div class="preclass-resume-text">
      <b>{{ title }}</b>
      <span>{{ subtitle }}</span>
    </div>
    <TUIButton variant="primary" size="sm" @click="emit('back')">
      {{ t('Preclass.ResumeBack') }}
    </TUIButton>
    <TUIButton variant="ghost" size="sm" @click="emit('dismiss')">
      {{ t('Preclass.ResumeDismiss') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIButton, t } from '@tencentcloud/roomkit-web-vue3';
import { CLASS_MODES } from './classMode';
import type { ClassCourse } from './types';

const props = defineProps<{
  roomId: string;
  /** Missing when the class is not in this user's schedule. */
  course?: ClassCourse;
}>();

const emit = defineEmits<{
  back: [];
  dismiss: [];
}>();

const title = computed(() => (props.course
  ? t('Preclass.ResumeTitle', { title: props.course.title })
  : t('Preclass.ResumeTitleGeneric')));

const subtitle = computed(() => [
  `${t('Preclass.RoomId')} ${props.roomId}`,
  props.course ? t(CLASS_MODES[props.course.classMode].label) : '',
].filter(Boolean).join(' · '));
</script>

<style scoped lang="scss">
.preclass-resume {
  position: relative;
  z-index: 2;
  display: flex;
  flex: none;
  gap: 12px;
  align-items: center;
  width: calc(100% - 80px);
  max-width: 1240px;
  padding: 12px 14px 12px 18px;
  margin: 4px auto 0;
  background: color-mix(in srgb, var(--rk-brand) 12%, var(--rk-bg-surface));
  border: 1px solid color-mix(in srgb, var(--rk-brand) 32%, transparent);
  border-radius: 14px;
}

.preclass-resume-dot {
  flex: none;
  width: 8px;
  height: 8px;
  background: var(--rk-brand);
  border-radius: 50%;
}

.preclass-resume-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.preclass-resume-text b,
.preclass-resume-text span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-resume-text b {
  font-size: 14px;
  font-weight: 600;
  color: var(--rk-text-primary);
}

.preclass-resume-text span {
  font-size: 12px;
  color: var(--rk-text-secondary);
}
</style>
