<template>
  <div class="local-screen-container">
    <div class="local-screen-control-container">
      <svg-icon size="48" icon="ScreenSharingIcon"></svg-icon>
      <text class="text">{{ t('You are sharing the screen...') }}</text>
      <span class="stop-button" @click="openStopConfirmDialog" @click.stop>
        <text class="text-end">
          {{ t('End sharing') }}
        </text>
      </span>
    </div>
    <Dialog
      v-model="showStopShareRegion"
      width="420px"
      :title="t('End sharing')"
      :modal="true"
      :close-on-click-modal="true"
      :append-to-room-container="true"
      :confirm-button="t('End sharing')"
      :cancel-button="t('Cancel')"
      @confirm="stopScreenSharing"
      @cancel="showStopShareRegion = false"
      @click.stop
    >
      <text class="text-toast">
        {{ t('Others will no longer see your screen after you stop sharing. Are you sure you want to stop?') }}
      </text>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import Dialog from '../../common/base/Dialog/index.vue';
import eventBus from '../../../hooks/useMitt';
import { useI18n } from '../../../locales';
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
  flex: 1;
  background-color: rgba(228, 232, 238, 0.40);
  justify-content: center;
  align-items: center;
  .local-screen-control-container {
		flex: 1;
		justify-content: center;
		align-items: center;
      .text {
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 24px;
        color: #B2BBD1;
      }
    .stop-button {
      display: flex;
      margin-top: 30px;
      padding: 10px 20px;
      background-color: #E5395C;
      border: 1.5px solid #E5395C;
      border-radius: 6px;
      .text-end{
        color: #FFFFFF;
      }
    }
  }
}

.text-toast {
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  color: #4f586b;
}

</style>
