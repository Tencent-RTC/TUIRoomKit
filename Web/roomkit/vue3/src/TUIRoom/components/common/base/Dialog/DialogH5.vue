<template>
  <div
    v-show="visible"
    ref="dialogRef"
    v-tap="handleOverlayClick"
    class="overlay-container"
    :class="[modal && 'overlay']"
    :style="overlayContainerStyle"
  >
    <div class="dialog-container">
      <span class="dialog-title">{{ props.title }}</span>
      <div :class="[hasTitle ? 'dialog-content' : 'dialog-content-notitle']">
        <slot></slot>
      </div>
      <div class="dialog-footer">
        <div v-tap="handleCancel" class="cancel-button">{{ props.cancelButton }}</div>
        <div v-tap="handleConfirm" class="confirm-button">{{ props.confirmButton }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import useZIndex from '../../../../hooks/useZIndex';
import vTap from '../../../../directives/vTap';

const visible = ref(false);
const overlayContainerStyle = ref({});
const { nextZIndex } = useZIndex();
const dialogRef = ref();
const hasTitle = computed(() => props.title !== '');

interface Props {
  modelValue: boolean;
  title?: string;
  confirmButton?: string;
  cancelButton?: string;
  closeOnClickModal?: boolean;
  appendToBody?: boolean;
  appendToRoomContainer?: boolean;
  modal?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  title: '',
  modelValue: false,
  confirmButton: '',
  cancelButton: '',
  closeOnClickModal: true,
  appendToBody: false,
  appendToRoomContainer: false,
  modal: false,
});
const emit = defineEmits(['update:modelValue', 'close', 'confirm', 'cancel']);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  },
);

watch(visible, (val) => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
    if (props.appendToRoomContainer) {
      document.getElementById('roomContainer')?.appendChild(dialogRef.value);
    }
  }
});

function handleConfirm() {
  emit('confirm');
  handleClose();
}
function handleCancel() {
  emit('cancel');
  handleClose();
}

function handleClose() {
  visible.value = false;
  emit('update:modelValue', false);
  emit('close');
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
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(15, 16, 20, 0.6);
  .dialog-container {
    min-width: 80vw;
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
    .dialog-title {
      display: inline-block;
      font-size: 16px;
      text-align: center;
      font-weight: 500;
      padding-top: 14px;
      padding: 24px 24px 12px 24px;
      box-sizing: border-box;
    }
    .dialog-content {
      font-weight: 400;
      font-size: 14px;
      text-align: center;
      font-weight: 400;
      color: var(--font-color-4);
      padding: 0 24px 20px 24px;
    }
    .dialog-content-notitle {
      font-size: 14px;
      text-align: center;
      padding: 40px;
    }
    .dialog-footer {
      border-top: 1px solid #d5e0f2;
      display: flex;
      .confirm-button,
      .cancel-button {
        color: var(--font-color-4);
        text-align: center;
        font-size: 16px;
        font-weight: 400;
        line-height: normal;
        padding: 14px;
        width: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .confirm-button {
        color: var(--active-color-1);
        border-left: 1px solid #d5e0f2;
      }
    }
  }
}
</style>
