<template>
  <Teleport v-if="host" :to="host">
    <div
      v-if="open"
      class="rk-dialog-mask"
      :class="{ 'rk-dialog-mask-bare': !mask, 'is-h5': !isPC }"
      :style="{ zIndex }"
      @click.self="onOverlay"
    >
      <div
        ref="panelRef"
        class="rk-dialog"
        :class="{ 'is-h5': !isPC }"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :style="panelStyle"
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
import { getPlatform } from '@tencentcloud/universal-api';
import { computed, ref, toRef } from 'vue';
import type { CSSProperties } from 'vue';
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
  /** Panel height; auto-sized from content when unset (max-height still applies). */
  height?: number | string;
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
  /**
   * Extra inline styles bound to the panel, merged after width / height so
   * callers win. The panel teleports outside the caller's DOM, so this is the
   * sanctioned way to deliver per-instance overrides such as `--rk-dialog-padding`.
   */
  style?: CSSProperties;
}>(), {
  closable: true,
  closeOnOverlay: true,
  closeOnEsc: true,
  mask: true,
  confirmText: 'OK',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  height: undefined,
  style: undefined,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [];
  'cancel': [];
  'close': [];
}>();

// Anything other than the PC web shell uses the H5 dialog.
const isPC = getPlatform() === 'pc';

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

const panelHeight = computed(() => {
  if (props.height == null) {
    return undefined;
  }
  return typeof props.height === 'number' ? `${props.height}px` : props.height;
});

const panelStyle = computed(() => ({
  width: panelWidth.value,
  height: panelHeight.value,
  left: `${x.value}px`,
  top: `${y.value}px`,
  ...(props.style ?? {}),
}));

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

  /* The conference design blurs the mask; the edu design drops the blur
   * (views-edu rk-set-mask / ClassRoster-edu backdrop), so the effect rides
   * a token the scene packs can override. */
  backdrop-filter: var(--rk-dialog-mask-blur, blur(6px));
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
  padding: var(--rk-dialog-padding, 24px 24px 20px);
  overflow: hidden;
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
  margin-bottom: var(--rk-dialog-header-gap, 6px);
}

.rk-dialog-title {
  margin: 0;
  font-size: var(--rk-fs-lg);
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
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  font-size: var(--rk-fs-sm);
  font-weight: 400;
  line-height: 1.45;
  color: var(--rk-text-secondary);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.rk-dialog-footer {
  display: flex;
  gap: 8px;
  margin-top: var(--rk-dialog-footer-gap, 16px);
}

.rk-dialog-footer :deep(.rk-btn) {
  box-sizing: border-box;
  flex: 1 1 0;
  min-width: 0;
  height: var(--rk-control-dialog);
  padding: 0 16px;
  font-size: var(--rk-fs-md);
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

.rk-dialog-mask.is-h5 {
  backdrop-filter: none;
}

.rk-dialog.is-h5 {
  max-width: calc(100% - 40px);
  padding: 18px 16px 14px;
  border-radius: var(--rk-radius-md);
}

.rk-dialog.is-h5 .rk-dialog-header {
  justify-content: center;
  margin-bottom: 8px;
}

.rk-dialog.is-h5 .rk-dialog-title {
  flex: 1 1 auto;
  font-size: var(--rk-fs-lg);
  text-align: center;
}

.rk-dialog.is-h5 .rk-dialog-body {
  font-size: var(--rk-fs-md);
  text-align: center;
}

.rk-dialog.is-h5:has(.rk-dialog-close) .rk-dialog-header,
.rk-dialog.is-h5:has(textarea, select, input:not([type='checkbox'], [type='radio'])) .rk-dialog-header {
  justify-content: space-between;
}

.rk-dialog.is-h5:has(.rk-dialog-close) .rk-dialog-title,
.rk-dialog.is-h5:has(.rk-dialog-close) .rk-dialog-body,
.rk-dialog.is-h5:has(textarea, select, input:not([type='checkbox'], [type='radio'])) .rk-dialog-title,
.rk-dialog.is-h5:has(textarea, select, input:not([type='checkbox'], [type='radio'])) .rk-dialog-body {
  text-align: start;
}

.rk-dialog.is-h5 .rk-dialog-footer :deep(.rk-btn) {
  height: 40px;
}
</style>
