<template>
  <div class="loading-overlay">
    <svg-icon style="display: flex" :icon="LoadingScheduleIcon" class="loading" />
    <span class="loading-text">{{ t('Entering the room now...') }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../locales';
import SvgIcon from '../common/base/SvgIcon.vue';
import LoadingScheduleIcon from '../../assets/icons/LoadingScheduleIcon.svg';
const { t } = useI18n();
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
  background-color: var(--bg-color-topbar);
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
