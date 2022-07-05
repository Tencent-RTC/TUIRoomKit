<template>
  <div class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :class="{ outlined: isSharing }"
      :title="title"
      :icon-name="startIconName"
      @click="startScreenShare"
    />
    <el-popover
      v-if="isSharing"
      ref="popoverRef"
      :virtual-ref="btnStopRef"
      trigger="click"
      placement="top-start"
      :show-arrow="false"
      :teleported="false"
    >
      <el-button text @click="openStopConfirmDialog">
        <svg-icon :icon-name="ICON_NAME.ScreenShareStopped" />
        结束共享
      </el-button>
    </el-popover>
    <el-dialog
      v-model="dialogVisible"
      width="420px"
      title="是否停止屏幕共享？"
      :modal="true"
      :append-to-body="true"
      :before-close="cancelStop"
    >
      <span>停止后所有人将无法继续观看屏幕内容</span>
      <template #footer>
        <span>
          <el-button type="primary" @click="stopScreenShare">停止共享</el-button>
          <el-button type="default" @click="cancelStop">取消</el-button>
        </span>
      </template>
    </el-dialog>
    <screen-window-select-dialog
      :visible="selectDialogVisible"
      :screen-list="screenList"
      :window-list="windowList"
      @on-confirm="onConfirmScreenShare"
      @on-cancel="selectDialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed } from 'vue';
import IconButton from '../../common/IconButton.vue';
import TUIRoomCore, {
  TRTCScreenCaptureSourceType,
  TRTCScreenCaptureSourceInfo,
  Rect,
  TRTCVideoEncParam,
  TRTCVideoResolution,
  TRTCVideoResolutionMode,
} from '../../../tui-room-core';
import ScreenWindowSelectDialog from './ScreenWindowSelectDialog.vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { ICON_NAME } from '../../../constants/icon';

const btnStopRef = ref();
const popoverRef = ref();
const isSharing: Ref<boolean> = ref(false);
const dialogVisible: Ref<boolean> = ref(false);

const title = computed(() => (isSharing.value ? '屏幕共享中' : '共享屏幕'));

const startIconName = computed(() => (isSharing.value ? ICON_NAME.ScreenSharing : ICON_NAME.ScreenShare));

const selectDialogVisible: Ref<boolean> = ref(false);
const screenList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);
const windowList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);

async function startScreenShare() {
  if (!isSharing.value && !selectDialogVisible.value) {
    const screenCaptureList = TUIRoomCore.getScreenCaptureSources(320, 180, 30, 30);
    screenList.value = screenCaptureList.filter(
      (screen: TRTCScreenCaptureSourceInfo) =>
        screen.type === TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeScreen // eslint-disable-line
    );
    windowList.value = screenCaptureList.filter(
      (screen: TRTCScreenCaptureSourceInfo) =>
        screen.type === TRTCScreenCaptureSourceType.TRTCScreenCaptureSourceTypeWindow
          && !screen.isMinimizeWindow // eslint-disable-line
    );
    selectDialogVisible.value = true;
  }
}

function onConfirmScreenShare(screenInfo: TRTCScreenCaptureSourceInfo) {
  const selectRect = new Rect();
  const screenShareEncParam = new TRTCVideoEncParam(
    TRTCVideoResolution.TRTCVideoResolution_1920_1080,
    TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
    15,
    1600,
    0,
    true,
  );
  TUIRoomCore.selectScreenCaptureTarget(
    screenInfo.type,
    screenInfo.sourceId,
    screenInfo.sourceName,
    selectRect,
    true, // mouse
    true, // highlight
  );
  TUIRoomCore.startScreenCapture(null, screenShareEncParam);
  isSharing.value = true;
  selectDialogVisible.value = false;
}

function openStopConfirmDialog() {
  if (isSharing.value) {
    dialogVisible.value = true;
  }
}

function cancelStop() {
  dialogVisible.value = false;
}

async function stopScreenShare() {
  TUIRoomCore.stopScreenCapture();
  isSharing.value = false;
  dialogVisible.value = false;
}
</script>
