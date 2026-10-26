<template>
  <div class="share-settings">
    <div class="share-settings-row">
      <span class="share-settings-row-label">
        <span class="share-settings-row-title">{{ t('Settings.ShareSystemAudio') }}</span>
        <span class="share-settings-row-description">{{ t('Settings.ShareSystemAudioDesc') }}</span>
      </span>
      <span class="share-settings-row-control">
        <TUISwitch v-model="shareSystemAudio" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TUISwitch, t } from '../../../base';
import { shareSystemAudio } from '../ScreenShareButton/useScreenShare';
</script>

<style scoped lang="scss">
.share-settings-row {
  display: flex;
  gap: var(--rk-space-4);
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: var(--rk-space-2) 0;
}

.share-settings-row-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.share-settings-row-title {
  font-size: var(--rk-fs-md);
  color: var(--rk-text-primary);
}

.share-settings-row-description {
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  color: var(--rk-text-tertiary);
}

.share-settings-row-control {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
}
</style>
