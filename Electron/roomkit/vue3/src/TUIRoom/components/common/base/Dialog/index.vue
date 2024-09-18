<!--
  * Name: Dialog
  * @param title String required [title of dialog]
  * @param modelValue Boolean [Controls whether a dialog is displayed]
  * @param modal Boolean [dialog Whether there is a mask layer]
  * @param width number | string [Width of the dialog]
  * @param beforeClose (done: DoneFn) => void; [dialog Callback function before closing]
  * @param closeOnClickModal Boolean [Whether or not clicking on the mask layer to close the dialog is supported]
  * @param showClose Boolean [Whether to show the close button]
  * @param appendToBody Boolean [Whether to append into body element]
  * @param appendToRoomContainer Boolean [Whether to append into roomContainer element]
  * Usage:
  * Use <Dialog title="there is title" v-model="showDialog"></Dialog> in template
-->
<template>
  <div v-if="visible">
    <teleport :to="targetName" :disabled="teleportDisable">
      <div
        ref="dialogRef"
        class="overlay-container"
        :class="[modal && 'overlay']"
        :style="overlayContainerStyle"
        @click="handleOverlayClick"
      >
        <div class="tui-dialog-container" :style="drawerContainerStyle">
          <div class="tui-dialog-header">
            <div class="tui-dialog-header-title">
              <svg-icon :icon="titleIcon" />
              <div class="tui-dialog-header-title-content">{{ title }}</div>
            </div>
            <template v-if="$slots.title">
              <slot name="title"></slot>
            </template>
            <div v-if="showClose" class="close">
              <svg-icon :size="16" @click="handleClose">
                <close-icon />
              </svg-icon>
            </div>
          </div>
          <div class="tui-dialog-content">
            <slot></slot>
          </div>
          <template v-if="$slots.footer">
            <div class="tui-dialog-footer">
              <slot name="footer"></slot>
            </div>
          </template>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import SvgIcon from '../SvgIcon.vue';
import CloseIcon from '../../icons/CloseIcon.vue';
import { addSuffix } from '../../../../utils/utils';
import useZIndex from '../../../../hooks/useZIndex';

type DoneFn = () => void;
type BeforeCloseFn = (done: DoneFn) => void;

interface Props {
  title?: string;
  modelValue: boolean;
  modal?: boolean;
  width?: string | number;
  beforeClose?: BeforeCloseFn | null;
  closeOnClickModal?: boolean;
  showClose?: boolean;
  appendToBody?: boolean;
  appendToRoomContainer?: boolean;
  confirmButton?: string;
  cancelButton?: string;
  titleIcon?: any;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  modelValue: false,
  modal: false,
  beforeClose: null,
  closeOnClickModal: true,
  width: undefined,
  showClose: true,
  appendToBody: false,
  appendToRoomContainer: false,
  confirmButton: '',
  cancelButton: '',
  titleIcon: null,
});

const emit = defineEmits(['update:modelValue', 'close', 'confirm', 'cancel']);

const { nextZIndex } = useZIndex();

const teleportDisable = computed(
  () => !props.appendToBody && !props.appendToRoomContainer
);

const targetName = computed(() => {
  if (props.appendToRoomContainer) {
    return '#roomContainer';
  }
  return 'body';
});

const overlayContainerStyle = ref({});

const visible = ref(false);

const dialogRef = ref();

const drawerContainerStyle = computed(() => {
  let style = '';
  if (props.width) {
    style += `--tui-dialog-width: ${addSuffix(props.width)}`;
  }
  return style;
});

watch(
  () => props.modelValue,
  val => {
    visible.value = val;
  },
  {
    immediate: true,
  }
);

watch(visible, val => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
  }
});

function doClose() {
  visible.value = false;
  emit('close');
  emit('update:modelValue', false);
}

function handleClose() {
  if (props.beforeClose) {
    props.beforeClose(doClose);
  } else {
    doClose();
  }
}

function handleOverlayClick(event: any) {
  if (!props.closeOnClickModal) {
    return;
  }
  if (event.target !== event.currentTarget) {
    return;
  }
  handleClose();
}
</script>

<style lang="scss" scoped>
.overlay-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  &.overlay {
    background-color: rgba(15, 16, 20, 0.6);
  }
}

.tui-dialog-container {
  --tui-dialog-width: 480px;

  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: var(--tui-dialog-width, 50%);
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 3px 1px #e9f0fb;
  transform: translate(-50%, -50%);

  .tui-dialog-header {
    position: relative;
    display: flex;
    align-items: center;
    height: 64px;
    padding: 0 24px;
    box-shadow: 0 7px 10px -5px rgba(230, 236, 245, 0.8);

    .tui-dialog-header-title {
      display: flex;

      .tui-dialog-header-title-content {
        margin-left: 8px;
        font-size: 16px;
        font-style: normal;
        font-weight: 600;
        line-height: 24px;
        color: #0f1014;
      }
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
      color: #4f586b;
      cursor: pointer;
      transform: translateY(-50%);
    }
  }

  .tui-dialog-content {
    flex: 1;
    padding: 20px 24px;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
    color: #4f586b;
  }

  .tui-dialog-footer {
    display: flex;
    justify-content: center;
    padding: 20px 30px;
  }
}
</style>
