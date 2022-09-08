<template>
  <div v-if="showScreenShareIcon" class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :disabled="isAudience"
      :title="title"
      :icon-name="iconName"
      @click="toggleScreenShare"
    />
    <div v-if="showStopShareRegion" class="stop-share-region" @click="openStopConfirmDialog">
      <svg-icon class="stop-share-icon" :icon-name="ICON_NAME.ScreenShareStopped" />
      <span>{{ t('End sharing') }}</span>
    </div>
    <el-dialog
      v-model="dialogVisible"
      custom-class="custom-element-class"
      width="420px"
      :title="t('Stop sharing?') "
      :modal="true"
      :append-to-body="true"
      :before-close="cancelStop"
    >
      <span>
        {{ t('Others will no longer see your screen after you stop sharing. Are you sure you want to stop?') }}</span>
      <template #footer>
        <span>
          <el-button type="primary" @click="stopScreenShare">{{ t('Stop sharing') }}</el-button>
          <el-button type="default" @click="cancelStop">{{ t('Cancel') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import IconButton from '../../common/IconButton.vue';
import TUIRoomCore, { ETUIRoomEvents, ETUIRoomRole } from '../../../tui-room-core';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../tui-room-core/common/logger';
import SvgIcon from '../../common/SvgIcon.vue';
import { ICON_NAME } from '../../../constants/icon';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from 'vue-i18n';

const logPrefix = '[ScreenShareControl]';

const basicStore = useBasicStore();
const { shareUserId, shareUserSig, isAudience, role } = storeToRefs(basicStore);
const showScreenShareIcon = computed(() => shareUserId.value && shareUserSig?.value);
const { t } = useI18n();

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);

const title = computed(() => (isSharing.value ? t('Sharing') : t('Share screen')));
const iconName = computed(() => {
  if (isAudience.value) {
    return ICON_NAME.ScreenShareDisabled;
  }
  return isSharing.value ? ICON_NAME.ScreenSharing : ICON_NAME.ScreenShare;
});

watch(role, (val: any, oldVal: any) => {
  if (oldVal === ETUIRoomRole.ANCHOR && val === ETUIRoomRole.AUDIENCE && isSharing.value) {
    stopScreenShare();
  }
});

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onWebScreenSharingStopped, stopScreenShare);
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onWebScreenSharingStopped, stopScreenShare);
});

async function toggleScreenShare() {
  if (isAudience.value) {
    ElMessage({
      type: 'warning',
      message: t('You currently do not have sharing permission, please raise your hand to apply for sharing permission first'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }
  if (isSharing.value) {
    showStopShareRegion.value = true;
    return;
  }
  try {
    const tuiResponse = await TUIRoomCore.startScreenShare({
      shareUserId: shareUserId.value,
      shareUserSig: shareUserSig?.value || '',
    });
    if (tuiResponse.code === 0) {
      isSharing.value = true;
    } else {
      logger.error(`${logPrefix}startScreenShare error: ${tuiResponse.code} ${tuiResponse.message}`);
      ElMessage({
        type: 'warning',
        message: tuiResponse.message,
        duration: MESSAGE_DURATION.LONG,
      });
    }
  } catch (error: any) {
    logger.error(`${logPrefix}startScreenShare error:`, error);
    throw error;
  }
}

function openStopConfirmDialog() {
  showStopShareRegion.value = false;
  if (isSharing.value) {
    dialogVisible.value = true;
  }
}

function cancelStop() {
  dialogVisible.value = false;
}

async function stopScreenShare() {
  if (isSharing.value) {
    try {
      await TUIRoomCore.stopScreenShare();
      dialogVisible.value = false;
      isSharing.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../assets/style/var.scss';
@import '../../../assets/style/element-custom.scss';

.screen-share-control-container {
  position: relative;
}
.stop-share-region {
  width: 131px;
  height: 48px;
  background: $toolBarBackgroundColor;
  border-radius: 4px;
  position: absolute;
  top: -58px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #CFD4E6;
}
.stop-share-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}
</style>
