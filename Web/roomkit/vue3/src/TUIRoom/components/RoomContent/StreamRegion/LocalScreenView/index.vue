<template>
  <div class="local-screen-container">
    <div :class="['local-screen-control-container', { mini: isMiniRegion }]">
      <div class="local-screen-info">
        <svg-icon :icon="ScreenSharingIcon" />
        <span class="text">{{ t('You are sharing the screen...') }}</span>
      </div>
      <tui-button
        size="default"
        class="stop-button"
        @click="openStopConfirmDialog"
      >
        {{ t('End sharing') }}
      </tui-button>
      <Dialog
        v-model="showStopShareRegion"
        width="420px"
        :title="t('End sharing')"
        :modal="true"
        :close-on-click-modal="true"
        :append-to-room-container="true"
      >
        <span>
          {{
            t(
              'Others will no longer see your screen after you stop sharing. Are you sure you want to stop?'
            )
          }}
        </span>
        <template #footer>
          <span>
            <tui-button
              class="dialog-button"
              size="default"
              @click="stopScreenSharing"
            >
              {{ t('End sharing') }}
            </tui-button>
            <tui-button
              type="primary"
              size="default"
              @click="showStopShareRegion = false"
            >
              {{ t('Cancel') }}
            </tui-button>
          </span>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import ScreenSharingIcon from '../../../common/icons/ScreenSharingIcon.vue';
import TuiButton from '../../../common/base/Button.vue';
import Dialog from '../../../common/base/Dialog';
import eventBus from '../../../../hooks/useMitt';
import { useI18n } from '../../../../locales';
const { t } = useI18n();
const showStopShareRegion = ref(false);

interface Props {
  isMiniRegion: boolean;
}

defineProps<Props>();

function openStopConfirmDialog() {
  showStopShareRegion.value = true;
}

function stopScreenSharing() {
  showStopShareRegion.value = false;
  eventBus.emit('ScreenShare:stopScreenShare');
}
</script>

<style lang="scss" scoped>
.local-screen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--background-color-1);

  &::before {
    width: 100%;
    height: 100%;
    content: '';
    background-color: var(--local-screen-stream-bg-color);
  }

  .local-screen-control-container {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--screen-font-color);
    transform: translate(-50%, -50%);

    &.mini {
      transform: translate(-50%, -50%) scale(0.7);
    }

    .local-screen-info {
      display: flex;
      flex-direction: column;
      align-items: center;

      .text {
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        white-space: nowrap;
      }
    }

    .stop-button {
      margin-top: 30px;
      background-color: var(--red-color-3);
      border: 1.5px solid var(--red-color-3);
    }
  }
}

.tui-theme-white .local-screen-container {
  --local-screen-stream-bg-color: rgba(228, 232, 238, 0.4);
}

.tui-theme-black .local-screen-container {
  --local-screen-stream-bg-color: rgba(34, 38, 46, 0.5);
}

.dialog-button {
  margin-right: 12px;
}
</style>
