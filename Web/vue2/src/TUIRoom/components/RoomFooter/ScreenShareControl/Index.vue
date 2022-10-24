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
      <span>结束共享</span>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :visible.sync="dialogVisible"
      custom-class="custom-element-class"
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
import { ref, Ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Message } from 'element-ui';
import IconButton from '../../common/IconButton.vue';
import TUIRoomCore, { ETUIRoomEvents, ETUIRoomRole } from '../../../tui-room-core';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../tui-room-core/common/logger';
import SvgIcon from '../../common/SvgIcon.vue';
import { ICON_NAME } from '../../../constants/icon';
import { MESSAGE_DURATION } from '../../../constants/message';

const logPrefix = '[ScreenShareControl]';

const basicStore = useBasicStore();
const { shareUserId, shareUserSig, isAudience, role } = storeToRefs(basicStore);
const showScreenShareIcon = computed(() => shareUserId.value && shareUserSig?.value);

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);

const title = computed(() => (isSharing.value ? '屏幕共享中' : '共享屏幕'));
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
    Message({
      type: 'warning',
      message: '您当前没有共享权限，请先举手申请上台获取共享权限',
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
      Message({
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
@import '../../../assets/style/element-ui-custom.scss';

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
