<template>
  <div class="screen-share-control-container">
    <icon-button
      ref="btnStopRef"
      :is-active="isSharing"
      :disabled="screenShareDisabled"
      :title="title"
      :icon="isSharing ? 'StopScreenShareIcon' : 'ScreenShareIcon'"
      @click-icon="toggleScreenShare"
    >
    </icon-button>
    <Dialog
      :model-value="isShowFraudDialog && isShowScreenShareAntiFraud"
      width="420px"
      :title="t('Safety Reminder')"
      :modal="true"
      :append-to-room-container="true"
    >
      <span>
        {{
          t(
            'Sharing screens may lead to the leakage of private information such as SMS verification codes and passwords, resulting in financial losses. Please be vigilant against various forms of fraud.',
          )
        }}
      </span>
      <template #footer>
        <span>
          <tui-button class="button" size="default" @click="startScreenShare">{{ t('Continue sharing') }}</tui-button>
          <tui-button type="primary" size="default" @click="isShowFraudDialog = false">{{ t('Cancel') }}</tui-button>
        </span>
      </template>
    </Dialog>
    <Dialog
      v-model="dialogVisible"
      width="420px"
      :title="t('End sharing')"
      :modal="true"
      :close-on-click-modal="true"
      :append-to-room-container="true"
      :confirm-button="t('End sharing')"
      :cancel-button="t('Cancel')"
      @confirm="stopScreenShare"
      @cancel="cancelStop"
    >
      <text class="text-toast">
        {{ t('Others will no longer see your screen after you stop sharing. Are you sure you want to stop?') }}
      </text>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message';
import Dialog from '../../common/base/Dialog/index.vue';
import IconButton from '../../common/base/IconButton.vue';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useRoomStore } from '../../../stores/room';
import { useBasicStore } from '../../../stores/basic';
import logger from '../../../utils/common/logger';
import { ICON_NAME } from '../../../constants/icon';
import { MESSAGE_DURATION } from '../../../constants/message';
import { useI18n } from '../../../locales';
import TuiButton from '../../common/base/Button.vue';
import eventBus from '../../../hooks/useMitt';

const roomEngine = useGetRoomEngine();

const logPrefix = '[ScreenShareControl]';

const roomStore = useRoomStore();
const basicStore = useBasicStore();
const { isAnchor, isAudience, hasOtherScreenShare } = storeToRefs(roomStore);
const { isShowScreenShareAntiFraud } = storeToRefs(basicStore);
const { t } = useI18n();

const btnStopRef = ref();
const dialogVisible: Ref<boolean> = ref(false);
const isShowFraudDialog: Ref<boolean> = ref(false);

// 麦下用户不能进行屏幕分享
const screenShareDisabled = computed(() => isAudience.value);
const title = computed(() => (roomStore.localUser.hasScreenStream ? t('End sharing') : t('Share screen')));

const isSharing = computed(() => roomStore.localUser.hasScreenStream);

watch(isAnchor, (val: any, oldVal: any) => {
  if (!oldVal && val && isSharing.value) {
    stopScreenShare();
  }
});

async function toggleScreenShare() {
  if (isSharing.value) {
    dialogVisible.value = true;
    return;
  }

  if (isAudience.value) {
    TUIMessage({
      type: 'warning',
      message: t('You currently do not have sharing permission, please raise your hand to apply for sharing permission first'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (hasOtherScreenShare.value) {
    TUIMessage({
      type: 'warning',
      message: t('Another user is currently sharing the screen, screen sharing is not possible.'),
      duration: MESSAGE_DURATION.LONG,
    });
    return;
  }

  if (!isShowScreenShareAntiFraud.value) {
    await startScreenShare();
    return;
  }
  isShowFraudDialog.value = true;
}


function cancelStop() {
  dialogVisible.value = false;
}

async function startScreenShare() {
  isShowFraudDialog.value = false;
  await roomEngine.instance?.startScreenSharing();
}

async function stopScreenShare() {
  if (isSharing.value) {
    try {
      await roomEngine.instance?.stopScreenSharing();
      dialogVisible.value = false;
    } catch (error) {
      logger.error(`${logPrefix}stopScreenShare error:`, error);
    }
  }
}

eventBus.on('ScreenShare:stopScreenShare', stopScreenShare);

onUnmounted(() => {
  eventBus.off('ScreenShare:stopScreenShare', stopScreenShare);
});
</script>

<style lang="scss" scoped>
.screen-share-control-container {
  position: relative;
}
.stop-share-region {
  width: 131px;
  height: 48px;
  background: #FFFFFF;
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
  // color: var(--color-font);
}
.stop-share-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}
.button {
  margin-left: 20px;
}
.text-toast {
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  color: #4f586b;
}
</style>
