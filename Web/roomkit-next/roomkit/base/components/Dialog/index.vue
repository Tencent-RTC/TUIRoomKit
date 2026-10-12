<template>
  <Teleport v-if="host" :to="host">
    <div
      v-if="open"
      class="rk-dialog-mask"
      :class="{ 'rk-dialog-mask-bare': !mask }"
      :style="{ zIndex }"
      @click.self="onOverlay"
    >
      <div
        ref="panelRef"
        class="rk-dialog"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :style="{ width: panelWidth, left: `${x}px`, top: `${y}px` }"
      >
        <div class="rk-dialog-header">
          <slot name="header">
            <h3 class="rk-dialog-title">
              {{ title }}
            </h3>
            <button
              v-if="closable"
              class="rk-dialog-close"
              type="button"
              aria-label="Close"
              @click="onClose"
            >
              <IconClose />
            </button>
          </slot>
        </div>
        <div class="rk-dialog-body">
          <slot />
        </div>
        <div class="rk-dialog-footer">
          <slot name="footer">
            <TUIButton
              v-if="cancelText !== ''"
              variant="secondary"
              :disabled="cancelDisabled"
              @click="onCancel"
            >
              {{ cancelText }}
            </TUIButton>
            <TUIButton
              v-if="confirmText !== ''"
              :variant="confirmVariant"
              :disabled="confirmDisabled"
              :loading="confirmLoading"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </TUIButton>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';
import { IconClose } from '../../icons';
import TUIButton from '../Button/index.vue';
import { useVisibleCenter } from '../../headless/useVisibleCenter';

defineOptions({ name: 'TUIDialog' });

const props = withDefaults(defineProps<{
  open: boolean;
  title?: string;
  width?: number | string;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  mask?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  confirmLoading?: boolean;
}>(), {
  closable: true,
  closeOnOverlay: true,
  closeOnEsc: true,
  mask: true,
  confirmText: 'OK',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [];
  'cancel': [];
  'close': [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const openRef = toRef(props, 'open');
const { host, zIndex, ctx } = useOverlay({
  lane: 'dialog',
  open: openRef,
  closeOnOutside: false,
  closeOnEsc: props.closeOnEsc,
  modal: true,
  onClose: () => onClose(),
}, [panelRef]);

useModality(openRef, panelRef, ctx?.root);
const { x, y } = useVisibleCenter(host, panelRef, openRef);

const panelWidth = computed(() => {
  if (props.width == null) return '360px';
  return typeof props.width === 'number' ? `${props.width}px` : props.width;
});

function onClose() {
  emit('update:open', false);
  emit('close');
}

function onCancel() {
  emit('cancel');
  onClose();
}

function onOverlay() {
  if (!props.closeOnOverlay) return;
  onClose();
}
</script>

<style scoped lang="scss">
.rk-dialog-mask {
  position: absolute;
  inset: 0;
  overscroll-behavior: contain;
  pointer-events: auto;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(6px);
}

.rk-dialog-mask-bare {
  background: transparent;
  backdrop-filter: none;
}

.rk-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 48px);
  max-height: min(calc(100% - 48px), calc(100vh - 48px));
  padding: 24px 24px 20px;
  overscroll-behavior: contain;
  background: var(--rk-bg-surface);
  border: var(--rk-dialog-border, 1px solid var(--rk-border));
  border-radius: var(--rk-radius-lg);
  outline: none;
  box-shadow: var(--rk-shadow-dialog);
}

.rk-dialog-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.rk-dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rk-text-primary);
  letter-spacing: -0.01em;
}

.rk-dialog-close {
  display: inline-flex;
  padding: 4px;
  margin: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--rk-radius-sm);
  transition: background 0.15s, color 0.15s;
}

.rk-dialog-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.rk-dialog-body {
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  color: var(--rk-text-secondary);

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-dialog-footer {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.rk-dialog-footer :deep(.rk-btn) {
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  height: var(--rk-control-dialog);
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--rk-radius-md);
}

.rk-dialog-footer :deep(.rk-btn-secondary) {
  color: var(--rk-text-primary);
  background: var(--rk-dialog-cancel-bg, var(--rk-bg-muted));
  border: var(--rk-dialog-cancel-border, 0);

  &:hover:not(:disabled) {
    background: var(--rk-dialog-cancel-hover, var(--rk-bg-hover));
  }
}

.rk-dialog-footer :deep(.rk-btn-primary),
.rk-dialog-footer :deep(.rk-btn-danger) {
  color: var(--rk-on-accent);
}

.rk-dialog-footer :deep(.rk-btn-primary) {
  background: var(--rk-brand);
}
</style>
