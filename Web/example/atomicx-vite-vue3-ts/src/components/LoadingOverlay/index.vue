<template>
  <div class="loading-overlay">
    <IconLoadingSchedule class="loading" size="36" />
    <span class="loading-text">{{ t('Room.EnteringRoom') }}</span>
  </div>
</template>

<script setup lang="ts">
import { IconLoadingSchedule, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading {
  animation: loading-rotate 1s linear infinite;
}

.loading-text {
  margin-top: 10px;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-color-primary);
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
