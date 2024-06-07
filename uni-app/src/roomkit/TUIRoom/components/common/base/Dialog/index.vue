<template>
  <div
    v-if="visible"
    ref="dialogRef"
    class="overlay-container"
    :class="[modal && 'overlay']"
    :style="overlayContainerStyle"
    @tap="handleOverlayClick"
  >
    <div class="dialog-container">
      <text class="dialog-title">{{ props.title }}</text>
      <div :class="[hasTitle ? 'dialog-content' : 'dialog-content-notitle']">
        <slot></slot>
      </div>
      <div class="dialog-footer">
        <text class="cancel-button" @tap="handleCancel">{{ props.cancelButton }}</text>
        <text class="confirm-button" @tap="handleConfirm">{{ props.confirmButton }}</text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import useZIndex from '../../../../hooks/useZIndex';

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
      document?.getElementById('roomContainer')?.appendChild(dialogRef.value);
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
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 16, 20, 0.6);
  .dialog-container {
    width: 640rpx;
    position: absolute;
    background-color: #ffffff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    font-style: normal;
    color: #000000;
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
      display: flex;
      align-items: center;
      font-weight: 400;
      font-size: 14px;
      font-weight: 400;
      color: #4F586B;
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
      flex-direction: row;
      .confirm-button,
      .cancel-button {
        flex: 1;
        color: #4F586B;
        text-align: center;
        font-size: 16px;
        font-weight: 400;
        line-height: normal;
        padding: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .confirm-button {
        color: #1C66E5;
        border-left: 1px solid #d5e0f2;
      }
    }
  }
}
</style>
