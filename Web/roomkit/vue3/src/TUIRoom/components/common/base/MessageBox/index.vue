<template>
  <transition name="tui-message-box-fade">
    <div
      v-show="visible"
      :style="overlayContentStyle"
      :class="['overlay']"
      class="message-box-overlay"
      @click="handleOverlayClick"
    >
      <div :class="isMobile ? 'tui-message-box-h5' : 'tui-message-box'">
        <div class="tui-message-box-header">
          <div class="tui-message-box-title">{{ title }}</div>
          <div class="close">
            <IconClose @click="handleClose" />
          </div>
        </div>
        <div class="tui-message-box-body">
          <div>{{ message }}</div>
        </div>
        <div v-if="isMobile" class="tui-message-box-footer">
          <div
            v-if="cancelButtonText"
            class="button-container"
            @click="handleClose('cancel')"
          >
            <TUIButton type="primary" style="min-width: 88px">{{
              cancelButtonText
            }}</TUIButton>
          </div>
          <div class="button-container" @click="handleClose('confirm')">
            <TUIButton type="primary" style="min-width: 88px">{{
              confirmButtonText
            }}</TUIButton>
          </div>
        </div>
        <div v-else class="tui-message-box-footer">
          <TUIButton
            @click="handleClose('confirm')"
            type="primary"
            style="min-width: 88px"
            >{{ confirmButtonText }}
          </TUIButton>
          <TUIButton
            v-if="cancelButtonText"
            @click="handleClose('cancel')"
            style="min-width: 88px"
          >
            {{ cancelButtonText }}
          </TUIButton>
        </div>
      </div>
    </div>
  </transition>
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
import { TUIButton, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { isMobile } from '../../../../utils/environment';
import useZIndex from '../../../../hooks/useZIndex';

const visible = ref(false);
const overlayContentStyle = ref({});
const { nextZIndex } = useZIndex();
let timer: number | null = null;

type BeforeCloseFn = (action?: Action) => void;

interface Props {
  title: string;
  message: string;
  callback?: BeforeCloseFn | null;
  duration: number;
  cancelButtonText: string;
  confirmButtonText: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  remove: Function;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  callback: null,
  duration: Infinity,
  cancelButtonText: '',
  confirmButtonText: '',
  remove: () => {},
});

watch(visible, val => {
  if (val) {
    overlayContentStyle.value = { zIndex: nextZIndex() };
  }
});

const emit = defineEmits(['close']);

export type Action = 'cancel' | 'confirm' | 'close';
function handleClose(action: Action) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  props.callback && props.callback(action);
  doClose();
}

function doClose() {
  visible.value = false;
  props.remove();
  emit('close');
}

function handleOverlayClick(event: any) {
  if (event.target !== event.currentTarget) {
    return;
  }
  handleClose('close');
}

function onOpen() {
  visible.value = true;
}

function duration() {
  if (props.duration === Infinity) return;
  timer = setTimeout(() => {
    handleClose('close');
  }, props.duration);
}

onMounted(async () => {
  onOpen();
  duration();
});
</script>

<style lang="scss" scoped>
.message-box-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &.overlay {
    background-color: var(--uikit-color-black-3);
  }
}

.tui-message-box {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: 480px;
  background-color: var(--bg-color-dialog);
  border-radius: 20px;
  transform: translate(-50%, -50%);

  .tui-message-box-header {
    position: relative;
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 24px;
    color: var(--text-color-primary);
    border-bottom: 1px solid var(--stroke-color-primary);

    .tui-dialog-header-title {
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
      color: var(--text-color-primary);
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
      color: var(--text-color-primary);
      cursor: pointer;
      transform: translateY(-50%);
    }
  }

  .tui-message-box-body {
    flex: 1;
    padding: 20px 24px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-primary);
  }

  .tui-message-box-footer {
    display: flex;
    justify-content: center;
    padding: 20px 30px;

    & > :not(:first-child) {
      margin-left: 16px;
    }
  }
}

.tui-message-box-h5 {
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  min-width: 80vw;
  max-width: 80vw;
  font-style: normal;
  color: var(--text-color-primary);
  background-color: var(--bg-color-dialog);
  border-radius: 8px;
  transform: translate(-50%, -50%);

  .tui-message-box-header {
    box-sizing: border-box;
    display: inline-block;
    padding: 24px 24px 12px;
    padding-top: 14px;
    font-size: 16px;
    font-weight: 500;
    text-align: center;

    .close {
      display: none;
    }
  }

  .tui-message-box-body {
    padding: 0 24px 20px;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-secondary);
    text-align: center;
  }

  .tui-message-box-footer {
    display: flex;
    justify-content: space-around;
    width: 100%;
    border-top: 1px solid var(--stroke-color-module);

    .button-container {
      display: flex;
      flex: 1;
      justify-content: center;
      padding: 11px 0;

      &:not(:first-child) {
        border-left: 1px solid var(--stroke-color-module);
      }
    }

    .button {
      font-size: 16px;
      font-weight: 500;
    }

    .confirm-button {
      color: var(--text-color-link);
      text-align: center;
      background-color: var(--bg-color-dialog);
      border: none;
    }
  }
}
</style>
