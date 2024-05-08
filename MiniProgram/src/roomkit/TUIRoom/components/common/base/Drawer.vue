<!--
  * Name: Drawer
  * @param title String required [title of dialog]
  * @param modelValue Boolean [Controls whether a drawer is displayed]
  * @param modal Boolean [drawer Whether there is a mask layer]
  * @param size number | string [Width of the drawer]
  * @param beforeClose (done: DoneFn) => void; [drawer Callback function before closing]
  * @param closeOnClickModal Boolean [Whether or not clicking on the mask layer to close the drawer is supported]
  * @param appendToBody Boolean [Whether to append into body element]
  * Usage:
  * Use <Drawer title="there is title" v-model="showDrawer"></Drawer> in template
  *
-->
<template>
  <div
    v-if="visible"
    ref="drawerRef"
    class="overlay-container"
    :class="[modal && 'overlay']"
    @mouseup="handleOverlayMouseUp"
    @mousedown="handleOverlayMouseDown"
    @click="handleOverlayClick"
  >
    <div class="drawer-container" :style="drawerContainerStyle">
      <div class="drawer-header">
        <div class="drawer-header-title">
          {{ title }}
        </div>
        <template v-if="$slots.title">
          <slot name="title"></slot>
        </template>
        <div class="close" @click="handleClose">
          <svg-icon style="display: flex" :size="16" :icon="CloseIcon" />
        </div>
      </div>
      <div class="drawer-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import SvgIcon from './SvgIcon.vue';
import CloseIcon from '../../../assets/icons/CloseIcon.svg';
import { addSuffix } from '../../../utils/utils';

type DoneFn = () => void;
type BeforeCloseFn = (done: DoneFn) => void;

interface Props {
  title?: string,
  modelValue: boolean,
  modal?: boolean,
  size?: string | number,
  beforeClose?: BeforeCloseFn | undefined;
  appendToBody?: boolean,
  appendToRoomContainer?: false;
  closeOnClickModal?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  modelValue: false,
  modal: false,
  size: '400',
  beforeClose: undefined,
  appendToBody: false,
  appendToRoomContainer: false,
  closeOnClickModal: true,
});

const emit = defineEmits(['update:modelValue']);

const drawerRef = ref();
const visible = ref(false);
const drawerContainerStyle = computed(() => `width: ${addSuffix(props.size)}`);

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  if (val) {
    if (props.appendToBody) {
      document?.body.appendChild(drawerRef.value);
    } else if (props.appendToRoomContainer) {
      document?.getElementById('roomContainer')?.appendChild(drawerRef.value);
    }
  }
});

function doClose() {
  visible.value = false;
  emit('update:modelValue', false);
}

function handleClose() {
  if (props.beforeClose) {
    props.beforeClose(doClose);
  } else {
    doClose();
  };
};

let mouseDownInCurrentTarget = false;
let mouseUpInCurrentTarget = false;

function handleOverlayMouseUp(event: any) {
  mouseUpInCurrentTarget = event.target === event.currentTarget;
}

function handleOverlayMouseDown(event: any) {
  mouseDownInCurrentTarget = event.target === event.currentTarget;
}

function handleOverlayClick() {
  if (!props.closeOnClickModal) {
    return;
  }
  if (mouseDownInCurrentTarget && mouseUpInCurrentTarget) {
    handleClose();
    mouseDownInCurrentTarget = false;
    mouseUpInCurrentTarget = false;
  }
}

</script>

<style lang="scss" scoped>
.overlay-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2007;
  &.overlay {
    background-color: rgba(15, 16, 20, 0.60);
  }
}

.tui-theme-white .drawer-container {
  --background-color: var(--background-color-1);
  --box-shadow: 0px 2px 4px rgba(32, 77, 141, 0.03),
    0px 6px 10px rgba(32, 77, 141, 0.06),
    0px 3px 14px rgba(32, 77, 141, 0.05);
}

.tui-theme-black .drawer-container {
  --background-color: var(--background-color-2);
  --box-shadow: 0px -8px 30px rgba(15, 16, 20, 0.5);
}

.drawer-container {
  background-color: var(--background-color);
  position: absolute;
  right: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--box-shadow);
  border-radius: 8px 0px 0px 8px;
  .drawer-header {
    height: 64px;
    box-shadow: 0px 1px 0px var(--stroke-color);
    position: relative;
    display: flex;
    padding: 0 20px;
    align-items: center;
    .drawer-header-title {
      color: var(--font-color-1);
      font-size: 16px;
      font-style: normal;
      font-weight: 600;
      line-height: 24px;
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
      color: var(--font-color-1);
      cursor: pointer;
    }
  }
  .drawer-content {
    flex: 1;
    overflow: auto;
  }
}
</style>
