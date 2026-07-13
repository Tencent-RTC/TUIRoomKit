<template>
  <div
    v-if="isRecording"
    ref="statusRef"
    class="cloud-recording-status"
    :class="{ clickable: isOwnerOrAdmin }"
    @click="isOwnerOrAdmin && toggleActions()"
  >
    <span class="recording-dot" />
    <span class="recording-label">{{ t('CloudRecording.StatusLabel') }}</span>

    <template v-if="isOwnerOrAdmin">
      <transition name="slide-in">
        <button
          v-if="showActions"
          class="stop-btn"
          @click.stop="handleStop"
        >
          <IconStopRecord size="16" />
          {{ t('CloudRecording.StopButton') }}
        </button>
      </transition>
      <IconChevronRight
        class="chevron"
        :class="{ expanded: showActions }"
        size="12"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useUIKit, IconStopRecord, IconChevronRight } from '@tencentcloud/uikit-base-component-vue3';
import { useCloudRecordingAction } from './useCloudRecordingAction';
import { useCloudRecordingEvents } from './useCloudRecordingEvents';

const { t } = useUIKit();
const { isRecording, isOwnerOrAdmin, confirmStopRecording } = useCloudRecordingAction();
useCloudRecordingEvents();

const statusRef = ref<HTMLElement | null>(null);
const showActions = ref(false);

watch([isRecording, isOwnerOrAdmin], ([recording, ownerOrAdmin]) => {
  if (!recording || !ownerOrAdmin) {
    showActions.value = false;
  }
});

function toggleActions() {
  showActions.value = !showActions.value;
}

function handleStop() {
  showActions.value = false;
  confirmStopRecording();
}

function handleClickOutside(event: MouseEvent) {
  if (statusRef.value && !statusRef.value.contains(event.target as Node)) {
    showActions.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.cloud-recording-status {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  overflow: hidden;
  background: var(--bg-color-input);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
  user-select: none;
  /* Pre-promote to compositor layer to isolate from video/canvas layers on Windows discrete GPUs */
  transform: translateZ(0);

  &.clickable {
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: var(--text-color-error);
  border-radius: 50%;
  /* steps(10) approximates breathing effect with only 10 GPU alpha-blend ops/cycle instead of ~72,
     reducing shader unit contention with video decode and whiteboard on discrete GPUs */
  animation: pulse 1.2s steps(10, end) infinite;
  flex-shrink: 0;
  will-change: opacity;
}

@keyframes pulse {
  0%, 15%, 100% { opacity: 1; }
  50%, 65% { opacity: 0.3; }
}

.recording-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
  white-space: nowrap;
}

.stop-btn {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 4px 10px;
  font-size: 13px;
  color: var(--text-color-primary);
  cursor: pointer;
  background: var(--bg-color-topbar);
  border: none;
  border-radius: 14px;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
}

.stop-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.chevron {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--text-color-primary);
  transition: transform 0.2s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
