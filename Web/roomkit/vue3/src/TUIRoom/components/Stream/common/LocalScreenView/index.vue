<template>
  <div class="local-screen-container" ref="localScreenContainerRef">
    <div :class="['local-screen-control-container', { mini: isMiniRegion }]">
      <div class="local-screen-info">
        <svg-icon :icon="ScreenSharingIcon" />
        <span class="text">{{ t('You are sharing the screen...') }}</span>
      </div>
      <TUIButton color="red" @click="openStopConfirmDialog" type="primary">
        {{ t('End sharing') }}
      </TUIButton>
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
            <TUIButton
              @click="stopScreenSharing"
              type="primary"
              style="min-width: 88px"
            >
              {{ t('End sharing') }}
            </TUIButton>
            <TUIButton
              @click="showStopShareRegion = false"
              style="min-width: 88px"
            >
              {{ t('Cancel') }}
            </TUIButton>
          </span>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import SvgIcon from '../../../common/base/SvgIcon.vue';
import ScreenSharingIcon from '../../../common/icons/ScreenSharingIcon.vue';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import Dialog from '../../../common/base/Dialog';
import eventBus from '../../../../hooks/useMitt';
import { useI18n } from '../../../../locales';
const { t } = useI18n();
const showStopShareRegion = ref(false);
const localScreenContainerRef = ref();
const isMiniRegion = ref(false);

function openStopConfirmDialog() {
  showStopShareRegion.value = true;
}

function stopScreenSharing() {
  showStopShareRegion.value = false;
  eventBus.emit('ScreenShare:stopScreenShare');
}
const resizeObserver = new ResizeObserver(() => {
  isMiniRegion.value = localScreenContainerRef.value?.offsetHeight <= 200;
});
onMounted(() => {
  resizeObserver.observe(localScreenContainerRef.value);
});
onBeforeUnmount(() => {
  resizeObserver.unobserve(localScreenContainerRef.value);
});
</script>

<style lang="scss" scoped>
.local-screen-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color-bubble-reciprocal);

  &::before {
    width: 100%;
    height: 100%;
    content: '';
    background-color: var(--bg-color-bubble-reciprocal);
  }

  .local-screen-control-container {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    color: var(--text-color-tertiary);

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
  }
}
</style>
