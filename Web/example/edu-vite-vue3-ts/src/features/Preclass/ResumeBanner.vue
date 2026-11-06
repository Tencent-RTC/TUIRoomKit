<template>
  <div class="preclass-resume" :class="{ 'is-h5': !isPC }" role="status">
    <span class="preclass-resume-dot" aria-hidden="true" />
    <div class="preclass-resume-text">
      <b>{{ title }}</b>
      <span>{{ subtitle }}</span>
    </div>
    <TUIButton variant="primary" size="sm" @click="emit('back')">
      {{ t('Preclass.ResumeBack') }}
    </TUIButton>
    <TUIButton v-if="isPC" variant="ghost" size="sm" @click="emit('dismiss')">
      {{ t('Preclass.ResumeDismiss') }}
    </TUIButton>
    <TUIButton
      v-else
      variant="ghost"
      size="sm"
      class="preclass-resume-close"
      :icon="IconClose"
      :aria-label="t('Preclass.ResumeDismiss')"
      @click="emit('dismiss')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getPlatform } from '@tencentcloud/universal-api';
import { IconClose, TUIButton, t } from '@tencentcloud/roomkit-web-vue3';
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

const isPC = getPlatform() === 'pc';

const title = computed(() => (props.course
  ? t('Preclass.ResumeTitle', { title: props.course.title })
  : t('Preclass.ResumeTitleGeneric')));

const subtitle = computed(() => [
  `${t('Preclass.RoomId')} ${props.roomId}`,
  props.course ? t('Preclass.ClassModeOneOnOne') : '',
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

.preclass-resume.is-h5 {
  gap: 10px;
  width: auto;
  padding: 10px 6px 10px 14px;
  margin: 4px 12px 8px;
  border: 0;
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

.preclass-resume.is-h5 .preclass-resume-text b {
  font-size: var(--rk-fs-md);
}

.preclass-resume.is-h5 .preclass-resume-text span {
  font-size: var(--rk-fs-sm);
}

.preclass-resume.is-h5 :deep(.rk-btn) {
  height: 32px;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  border-radius: 8px;
}

.preclass-resume.is-h5 .preclass-resume-close {
  width: 32px;
  color: var(--rk-text-secondary);
}

.preclass-resume-close {
  width: var(--rk-control-sm);
  padding: 0;
}
</style>
