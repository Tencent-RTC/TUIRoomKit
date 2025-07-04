<template>
  <div v-show="visible" class="tui-notification">
    <div
      v-if="isMobile"
      class="tui-notification-container-mobile"
      :style="overlayContainerStyle"
    >
      <IconApplyTips class="tui-notification-mobile-icon" />
      <span class="tui-notification-mobile-content">{{ message }}</span>
      <div class="tui-notification-mobile-check" @click="handleAgree">
        {{ confirmButtonText }}
      </div>
    </div>
    <div
      v-else
      class="tui-notification-container"
      :style="overlayContainerStyle"
    >
      <div class="tui-notification-header">
        <div class="tui-notification-title">{{ message }}</div>
        <div class="close">
          <IconClose @click="handleClose" />
        </div>
      </div>
      <div class="tui-notification-footer">
        <TUIButton @click="handleAgree" type="primary" style="min-width: 88px">
          {{ confirmButtonText }}
        </TUIButton>
        <TUIButton @click="handleReject" style="min-width: 88px">
          {{ cancelButtonText }}
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  watch,
  onMounted,
  withDefaults,
  defineProps,
  defineEmits,
} from 'vue';
import {
  TUIButton,
  IconClose,
  IconApplyTips,
} from '@tencentcloud/uikit-base-component-vue3';
// import SvgIcon from '../SvgIcon.vue';
// import CloseIcon from '../../icons/CloseIcon.vue';
// import ApplyTipsIcon from '../../icons/ApplyTipsIcon.vue';
import useZIndex from '../../../../hooks/useZIndex';
import { isMobile } from '../../../../utils/environment';

const visible = ref(false);
const overlayContainerStyle = ref({});
const { nextZIndex } = useZIndex();

type BeforeCloseFn = () => void;

interface Props {
  message: string;
  confirm?: BeforeCloseFn | null;
  cancel?: BeforeCloseFn | null;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  confirmButtonText: '',
  cancelButtonText: '',
  confirm: null,
  cancel: null,
});

const emit = defineEmits(['close']);

watch(visible, val => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
  }
});

function handleClose() {
  visible.value = false;
  emit('close');
}

function handleAgree() {
  if (props.confirm) {
    props.confirm();
  }
  handleClose();
}

function handleReject() {
  if (props.cancel) {
    props.cancel();
  }
  handleClose();
}

function onOpen() {
  visible.value = true;
}

onMounted(async () => {
  onOpen();
});
</script>

<style lang="scss" scoped>
.tui-notification {
  .tui-notification-container-mobile {
    position: fixed;
    top: 8%;
    display: flex;
    width: 95%;
    height: 44px;
    margin: 0 10px;
    text-align: center;
    border-radius: 10px;
    background-color: var(--bg-color-dialog);
    box-shadow: 0 3px 8px var(--uikit-color-black-8);

    .tui-notification-mobile-icon {
      padding: 0 10px;
      margin-left: 4px;
      color: var(--text-color-primary);
    }

    .tui-notification-mobile-content {
      margin: 0 auto 0 4px;
      font-size: 15px;
      font-weight: 400;
      line-height: 44px;
      color: var(--text-color-secondary);
    }

    .tui-notification-mobile-check {
      padding: 0 12px;
      margin: 6px 10px 6px 0;
      line-height: 34px;
      border-radius: 10px;
      color: var(--text-color-primary);
      background-color: var(--text-color-link);
    }
  }

  .tui-notification-container {
    position: fixed;
    top: 7%;
    right: 1%;
    display: flex;
    flex-direction: column;
    width: 400px;
    border-radius: 20px;
    background-color: var(--bg-color-dialog);
    box-shadow: 0 3px 8px var(--uikit-color-black-8);

    .tui-notification-header {
      position: relative;
      display: flex;
      align-items: center;
      height: 64px;
      padding: 0 24px;
      font-weight: 500;
      color: var(--text-color-primary);

      .tui-notification-title {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .close {
        position: absolute;
        top: 50%;
        right: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        cursor: pointer;
        transform: translateY(-50%);
        color: var(--text-color-primary);
      }
    }
  }

  .tui-notification-footer {
    display: flex;
    justify-content: flex-end;
    padding: 20px 30px;
  }
}
</style>
