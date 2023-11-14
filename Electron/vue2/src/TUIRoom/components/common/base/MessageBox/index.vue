<template>
  <transition name="tui-message-box-fade" :disabled="teleportDisable">
    <div
      v-show="visible"
      ref="messageRef"
      :style="overlayContentStyle"
      :class="['overlay']"
      class="message-box-overlay"
      @click="handleOverlayClick"
    >
      <div :class="isMobile ? 'tui-message-box-h5' : 'tui-message-box'">
        <div class="tui-message-box-header">
          <div class="tui-message-box-title">{{ title }}</div>
          <div class="close">
            <svg-icon :size="16" :icon="CloseIcon" @click="handleClose"></svg-icon>
          </div>
        </div>
        <div class="tui-message-box-body">
          <div>{{ message }}</div>
        </div>
        <div class="tui-message-box-footer">
          <tui-button size="default" class="button" @click="handleClose">{{ confirmButtonText }}</tui-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue';
import TuiButton from '../Button.vue';
import SvgIcon from '../SvgIcon.vue';
import CloseIcon from '../../icons/CloseIcon.vue';
import { isMobile } from '../../../../utils/useMediaValue';
import useZIndex from '../../../../hooks/useZIndex';

const visible = ref(false);
const overlayContentStyle = ref({});
const { nextZIndex } = useZIndex();
const messageRef = ref();
const teleportDisable = computed(() => !props.appendToBody);

type BeforeCloseFn = () => void;

interface Props {
  title: string;
  message: string;
  callback?: BeforeCloseFn | null;
  confirmButtonText: string;
  remove: Function;
  appendToBody?: boolean;
  appendToRoomContainer?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  callback: null,
  confirmButtonText: '',
  remove: () => {},
  appendToBody: false,
  appendToRoomContainer: false,
});

watch(visible, (val) => {
  if (val) {
    overlayContentStyle.value = { zIndex: nextZIndex() };
    if (props.appendToRoomContainer) {
      document.getElementById('roomContainer')?.appendChild(messageRef.value);
    }
  }
});

const emit = defineEmits(['close']);

function handleClose() {
  props.callback && props.callback();
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
.message-box-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  right: 0;

  &.overlay {
    background-color: rgba(15, 16, 20, 0.6);
  }
}

.tui-message-box {
  width: 480px;
  background-color: var(--white-color);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  .tui-message-box-header {
    height: 64px;
    position: relative;
    display: flex;
    padding: 0 24px;
    color: var(--title-color);
    align-items: center;
    box-shadow: 0px 7px 10px -5px rgba(230, 236, 245, 0.8);
    .tui-dialog-header-title {
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
      color: #0f1014;
    }
    .close {
      width: 32px;
      height: 32px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #4f586b;
      cursor: pointer;
    }
  }
}
.tui-message-box-h5 {
  min-width: 80vw;
  max-width: 80vw;
  position: fixed;
  background-color: #ffffff;
  border-radius: 8px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  font-style: normal;
  color: var(--black-color);
  .tui-message-box-header {
    display: inline-block;
    font-size: 16px;
    text-align: center;
    font-weight: 500;
    padding-top: 14px;
    padding: 24px 24px 12px 24px;
    box-sizing: border-box;
    .close {
      display: none;
    }
  }
  .tui-message-box-body {
    font-weight: 400;
    font-size: 14px;
    text-align: center;
    font-weight: 400;
    color: var(--font-color-4);
    padding: 0 24px 20px 24px;
  }
  .tui-message-box-footer {
    width: 100%;
    border-top: 1px solid #d5e0f2;
    display: flex;
    justify-content: center;
    padding: 11px 0;
    .button {
      background-color: #fff;
      color: var(--active-color-1);
      border: none;
      text-align: center;
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.tui-message-box-body {
  flex: 1;
  padding: 20px 24px;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 22px;
  color: #4f586b;
}

.tui-message-box-footer {
  padding: 20px 30px;
  display: flex;
  justify-content: flex-end;
}
</style>
