<template>
  <div v-if="!screenShareDisabled" class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :disabled="screenShareDisabled"
      :title="title"
      :icon-name="startIconName"
      @click="toggleScreenShare"
    />
    <div v-if="showStopShareRegion" class="stop-share-region" @click="openStopConfirmDialog">
      <svg-icon class="stop-share-icon" :icon-name="ICON_NAME.ScreenShareStopped" />
      <span>结束共享</span>
    </div>
    <el-dialog
      v-model="dialogVisible"
      width="420px"
      title="是否停止屏幕共享？"
      :modal="true"
      :append-to-body="true"
      :before-close="cancelStop"
    >
      <span>是否结束当前的共享屏幕，停止后所有人将无法继续观看屏幕内容</span>
      <template #footer>
        <span>
          <el-button type="primary" @click="stopScreenShare">停止共享</el-button>
          <el-button type="default" @click="cancelStop">取消</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import IconButton from '../../common/IconButton.vue';
import TUIRoomCore, { ETUIRoomEvents } from '../../../tui-room-core';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../tui-room-core/common/logger';
import SvgIcon from '../../common/SvgIcon.vue';
import { ICON_NAME } from '../../../constants/icon';
import { MESSAGE_DURATION } from '../../../constants/message';

const logPrefix = '[ScreenShareControl]';

const basicInfo = useBasicStore();
const { shareUserId, shareUserSig } = storeToRefs(basicInfo);

const screenShareDisabled = computed(() => !shareUserId.value && !shareUserSig?.value);
logger.debug(`${logPrefix}screenShareDisabled: ${screenShareDisabled.value}`);

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);

const title = computed(() => (isSharing.value ? '屏幕共享中' : '共享屏幕'));

const startIconName = computed(() => (isSharing.value ? ICON_NAME.ScreenSharing : ICON_NAME.ScreenShare));

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onWebScreenSharingStopped, stopScreenShare);
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onWebScreenSharingStopped, stopScreenShare);
});

async function toggleScreenShare() {
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
