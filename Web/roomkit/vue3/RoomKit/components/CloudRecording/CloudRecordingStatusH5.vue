<template>
  <div
    v-if="isRecording"
    ref="statusRef"
    class="cloud-recording-status-h5"
    :class="{ expandable: isOwnerOrAdmin }"
  >
    <!-- Title: always visible -->
    <div class="card-title" @click.stop="isOwnerOrAdmin && toggleMenu()">
      <span class="recording-dot" />
      <span class="recording-label">{{ t('CloudRecording.StatusLabel') }}</span>
      <IconChevronRight
        v-if="isOwnerOrAdmin"
        class="chevron"
        :class="{ expanded: showMenu }"
        size="12"
      />
    </div>

    <!-- Content: always in DOM, height animated via max-height + overflow: hidden -->
    <div
      v-if="isOwnerOrAdmin"
      class="card-content"
      :class="{ expanded: showMenu }"
    >
      <div class="card-content-inner">
        <button class="action-btn" @click.stop="handleStop">
          <div class="action-icon">
            <IconStopRecord size="30" />
          </div>
          <span class="action-label">{{ t('CloudRecording.StopButton') }}</span>
        </button>
      </div>
    </div>
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
const showMenu = ref(false);

watch([isRecording, isOwnerOrAdmin], ([recording, ownerOrAdmin]) => {
  if (!recording || !ownerOrAdmin) {
    showMenu.value = false;
  }
});

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function handleStop() {
  showMenu.value = false;
  confirmStopRecording();
}

function handleClickOutside(event: MouseEvent) {
  if (statusRef.value && !statusRef.value.contains(event.target as Node)) {
    showMenu.value = false;
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
.cloud-recording-status-h5 {
  display: inline-flex;
  flex-direction: column;
  background: var(--bg-color-input);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 16%);
  overflow: hidden;
  user-select: none;
  /* Pre-promote to compositor layer to isolate from video/canvas layers on Windows discrete GPUs */
  transform: translateZ(0);

  &.expandable {
    cursor: pointer;
  }
}

.card-title {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
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
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-primary);
  white-space: nowrap;
}

.chevron {
  display: flex;
  align-items: center;
  color: var(--text-color-primary);
  transition: transform 0.25s ease;
  flex-shrink: 0;
  transform: rotate(90deg);

  &.expanded {
    transform: rotate(270deg);
  }
}

.card-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;

  &.expanded {
    max-height: 120px;
  }
}

.card-content-inner {
  display: flex;
  justify-content: center;
  padding: 12px 24px 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color-primary);

  &:active .action-icon {
    opacity: 0.7;
  }
}

.action-label {
  font-size: 12px;
  color: var(--text-color-primary);
}
</style>
