<template>
  <div class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :class="{ outlined: isSharing }"
      :title="title"
      :disabled="isAudience"
      :icon-name="iconName"
      @click="startScreenShare"
    />
    <el-popover
      v-if="isSharing"
      ref="popoverRef"
      class="custom-element-class"
      :virtual-ref="btnStopRef"
      trigger="click"
      placement="top-start"
      :show-arrow="false"
      :teleported="false"
    >
      <el-button text @click="openStopConfirmDialog">
        <svg-icon :icon-name="ICON_NAME.ScreenShareStopped" />
        {{ t('End sharing') }}
      </el-button>
    </el-popover>
    <el-dialog
      v-model="dialogVisible"
      width="420px"
      :title="t('Stop sharing?') "
      :modal="true"
      :append-to-body="true"
      :before-close="cancelStop"
    >
      <span>{{ t('Others will no longer see your screen after you stop sharing.') }}</span>
      <template #footer>
        <span>
          <el-button type="primary" @click="stopScreenShare">{{ t('Stop sharing') }}</el-button>
          <el-button type="default" @click="cancelStop">{{ t('Cancel') }}</el-button>
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
  import { ref, Ref, watch, computed } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useI18n } from 'vue-i18n';

  import IconButton from '../../common/IconButton.vue';
  import TUIRoomEngine, {
    TRTCScreenCaptureSourceType,
    TRTCScreenCaptureSourceInfo,
    Rect,
    TRTCVideoEncParam,
    TRTCVideoResolution,
    TRTCVideoResolutionMode,
  } from '@tencentcloud/tuiroom-engine-electron';
  import ScreenWindowSelectDialog from './ScreenWindowSelectDialog.vue';
  import SvgIcon from '../../common/SvgIcon.vue';
  import { ICON_NAME } from '../../../constants/icon';
  import { useBasicStore } from '../../../stores/basic';
  import { useRoomStore } from '../../../stores/room';
  import useGetRoomEngine from '../../../hooks/useRoomEngine';

  const { t } = useI18n();

  const basicInfo = useBasicStore();
  const roomStore = useRoomStore();
  const { isAudience } = storeToRefs(roomStore);
  const roomEngine = useGetRoomEngine();

  const btnStopRef = ref();
  const popoverRef = ref();
  const isSharing: Ref<boolean> = ref(false);
  const dialogVisible: Ref<boolean> = ref(false);

  const title = computed(() => (isSharing.value ? t('Sharing') : t('Share screen')));
  const iconName = computed(() => {
    if (isAudience.value) {
      return ICON_NAME.ScreenShareDisabled;
    }
    return isSharing.value ? ICON_NAME.ScreenSharing : ICON_NAME.ScreenShare;
  });

  const selectDialogVisible: Ref<boolean> = ref(false);
  const screenList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);
  const windowList: Ref<Array<TRTCScreenCaptureSourceInfo>> = ref([]);

  async function startScreenShare() {
    if (!window.isHasScreen && process.platform === 'darwin') {
      const { shell } = require('electron');
      shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`);
      // return;
    }
    if (!isSharing.value && !selectDialogVisible.value) {
      const screenCaptureList: any = await roomEngine.instance?.getScreenSharingTarget();
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
    roomEngine.instance?.startScreenSharingElectron(screenInfo.sourceId);
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
    roomEngine.instance?.stopScreenSharingElectron();
    isSharing.value = false;
    dialogVisible.value = false;
  }
</script>

<style lang="scss">
  @import '../../../assets/style/element-custom.scss'
</style>
