<template>
  <div class="screen-share-control-container">
      <icon-button
        :is-active="isSharing"
        ref="btnStopRef"
        :class="{ outlined: isSharing }"
        :title="title"
        :disabled="isAudience"
        :icon-name="iconName"
        @click.native="startScreenShare"
      />
      <div  v-if="showStopShareRegion" class="stop-share-region" @click.prevent="openStopConfirmDialog">
        <svg-icon class="stop-share-icon"  :icon-name="ICON_NAME.ScreenShareStopped" />
        <span> {{ t('End sharing') }} </span>
      </div>
    <Dialog
      :model-value="dialogVisible"
      width="420px"
      :title="t('Stop sharing?') "
      :modal="true"
      :append-to-body="true"
      :before-close="cancelStop"
    >
      <span>{{ t('Others will no longer see your screen after you stop sharing.') }}</span>
      <template #footer>
        <span>
          <el-button type="primary" @click.native="stopScreenShare">{{ t('Stop sharing') }}</el-button>
          <el-button type="default" @click.native="cancelStop">{{ t('Cancel') }}</el-button>
        </span>
      </template>
    </Dialog>
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
  import { useI18n } from '../../../locales';

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
  import Dialog from '../../../elementComp/Dialog/index.vue';
  import Popover from '../../../elementComp/Popover.vue';

  const { t } = useI18n();

  const basicInfo = useBasicStore();
  const roomStore = useRoomStore();
  const { isAudience } = storeToRefs(roomStore);
  const roomEngine = useGetRoomEngine();

  const btnStopRef = ref();
  const popoverRef = ref();
  const isSharing: Ref<boolean> = ref(false);
  const dialogVisible: Ref<boolean> = ref(false);
  const showStopShareRegion: Ref<boolean> = ref(false);

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
    if (!(window as any).isHasScreen && process.platform === 'darwin') {
      const { shell } = require('electron');
      shell.openExternal(`x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`);
      // todo: 这里不能注释，防止应用不出现在屏幕录制权限列表里
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
      );
      selectDialogVisible.value = true;
    }
    if(isSharing.value ) {
      showStopShareRegion.value = true
    }
  }

  function onConfirmScreenShare(screenInfo: TRTCScreenCaptureSourceInfo) {
    roomEngine.instance?.startScreenSharingElectron(screenInfo.sourceId);
    isSharing.value = true;
    selectDialogVisible.value = false;
  }

  function openStopConfirmDialog() {
    showStopShareRegion.value = false
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
  @import '../../../assets/style/var.scss';
  @import '../../../assets/style/element-custom.scss';
  .screen-share-control-container {
    position: relative;
  }
  .stop-share-region {
    width: 131px;
    height: 48px;
    background: var(--stop-share-region-bg-color);
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
    color: var(--color-font);
  }
  .stop-share-icon {
    width: 24px;
    height: 24px;
    margin-right: 10px;
  }
</style>
