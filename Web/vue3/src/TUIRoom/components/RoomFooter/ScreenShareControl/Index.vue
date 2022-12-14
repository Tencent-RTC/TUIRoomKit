<template>
  <div class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :disabled="screenShareDisabled"
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
      class="custom-element-class"
      width="420px"
      :title="t('Stop sharing?') "
      :modal="true"
      :append-to-body="false"
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
import { ref, Ref, computed, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import IconButton from '../../common/IconButton.vue';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useRoomStore } from '../../../stores/room';
import logger from '../../../utils/common/logger';
import SvgIcon from '../../common/SvgIcon.vue';
import { ICON_NAME } from '../../../constants/icon';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from 'vue-i18n';

const roomEngine = useGetRoomEngine();

const logPrefix = '[ScreenShareControl]';

const roomStore = useRoomStore();
const { isAnchor, isAudience, enableVideo } = storeToRefs(roomStore);
const { t } = useI18n();

const btnStopRef = ref();
const isSharing: Ref<boolean> = ref(false);
const showStopShareRegion: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);

// 麦下用户不能进行屏幕分享
// 全员禁画时，普通用户不能进行屏幕分享
const screenShareDisabled = computed(() => (
  isAudience.value || (roomStore.localUser.userRole === TUIRole.kGeneralUser && !enableVideo.value)
));
const title = computed(() => (isSharing.value ? t('Sharing') : t('Share screen')));
const iconName = computed(() => {
  if (screenShareDisabled.value) {
    return ICON_NAME.ScreenShareDisabled;
  }
  return isSharing.value ? ICON_NAME.ScreenSharing : ICON_NAME.ScreenShare;
});

watch(isAnchor, (val: any, oldVal: any) => {
  if (!oldVal && val && isSharing.value) {
    stopScreenShare();
  }
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
  if (roomStore.localUser.userRole === TUIRole.kGeneralUser && !enableVideo.value) {
    ElMessage({
      type: 'warning',
      message: t('Has been full static painting, can not share your screen'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }
  if (isSharing.value) {
    showStopShareRegion.value = true;
    return;
  }
  try {
    await roomEngine.instance?.startScreenSharing();
    isSharing.value = true;
  } catch (error: any) {
    logger.error(`${logPrefix}startScreenShare error:`, error);
    let message = '';
    // 当屏幕分享流初始化失败时, 提醒用户并停止后续进房发布流程
    switch (error.name) {
      case 'NotReadableError':
        // 提醒用户确保系统允许当前浏览器获取屏幕内容
        message = '系统禁止当前浏览器获取屏幕内容';
        break;
      case 'NotAllowedError':
        if (error.message.includes('Permission denied by system')) {
          // 提醒用户确保系统允许当前浏览器获取屏幕内容
          message = '系统禁止当前浏览器获取屏幕内容';
        } else {
          // 用户拒绝/取消屏幕分享
          message = '用户拒绝/取消屏幕分享';
        }
        break;
      default:
        // 初始化屏幕分享流时遇到了未知错误，提醒用户重试
        message = '屏幕分享遇到未知错误';
        break;
    }
    ElMessage({
      type: 'warning',
      message,
      duration: MESSAGE_DURATION.LONG,
    });
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
      await roomEngine.instance?.stopScreenSharing();
      dialogVisible.value = false;
      isSharing.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}

function screenCaptureStopped() {
  isSharing.value = false;
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onUserScreenCaptureStopped, screenCaptureStopped);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onUserScreenCaptureStopped, screenCaptureStopped);
});
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
