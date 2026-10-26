<template>
  <Teleport v-if="host" :to="host">
    <div
      v-if="open"
      class="rk-action-sheet-mask"
      :class="{ 'rk-action-sheet-mask-bare': !mask }"
      :style="{ zIndex }"
      @click.self="onOverlay"
    >
      <div
        ref="panelRef"
        class="rk-action-sheet"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div
          v-for="(group, groupIndex) in groups"
          :key="groupIndex"
          class="rk-action-sheet-group"
        >
          <button
            v-for="(action, index) in group"
            :key="`${groupIndex}-${index}`"
            class="rk-action-sheet-item"
            :class="{ 'is-danger': action.danger, 'is-cancel': action.cancel }"
            type="button"
            :disabled="action.disabled"
            @click="onSelect(action)"
          >
            <span>{{ action.label }}</span>
            <small v-if="action.hint">{{ action.hint }}</small>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue';
import { useModality } from '../../headless/useModality';
import { useOverlay } from '../../headless/useOverlay';

defineOptions({ name: 'TUIActionSheet' });

export interface ActionSheetAction {
  label: string;
  hint?: string;
  /** Ends the meeting for everyone. Painted in the danger color. */
  danger?: boolean;
  /** The dismiss row. Selecting it only closes the sheet. */
  cancel?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<{
  open: boolean;
  groups: ActionSheetAction[][];
  mask?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  /** Close after any row, including actions that are not cancel. */
  closeOnSelect?: boolean;
}>(), {
  mask: true,
  closeOnOverlay: true,
  closeOnEsc: true,
  closeOnSelect: true,
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'select': [action: ActionSheetAction];
  'close': [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const openRef = toRef(props, 'open');

function requestClose() {
  emit('update:open', false);
  emit('close');
}

const { host, zIndex, ctx } = useOverlay({
  lane: 'dialog',
  open: openRef,
  closeOnOutside: false,
  closeOnEsc: props.closeOnEsc,
  modal: true,
  onClose: requestClose,
}, [panelRef]);

useModality(openRef, panelRef, ctx?.root);

function onOverlay() {
  if (!props.closeOnOverlay) return;
  requestClose();
}

function onSelect(action: ActionSheetAction) {
  if (action.disabled) return;
  emit('select', action);
  if (action.cancel || props.closeOnSelect) {
    requestClose();
  }
}
</script>

<style scoped lang="scss">
.rk-action-sheet-mask {
  position: absolute;
  inset: 0;
  overscroll-behavior: contain;
  display: flex;
  align-items: flex-end;
  padding: 0 8px max(8px, env(safe-area-inset-bottom));
  pointer-events: auto;
  background: rgb(0 0 0 / 40%);
}

.rk-action-sheet-mask-bare {
  background: transparent;
}

.rk-action-sheet {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  outline: none;
}

.rk-action-sheet-group {
  overflow: hidden;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-md);
}

.rk-action-sheet-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 42px;
  padding: 8px 12px;
  color: var(--rk-text-primary);
  font: inherit;
  font-size: var(--rk-fs-lg);
  font-weight: 400;
  line-height: 1.2;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.rk-action-sheet-item + .rk-action-sheet-item {
  border-top: 1px solid var(--rk-border);
}

.rk-action-sheet-item small {
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  font-weight: 400;
}

.rk-action-sheet-item.is-danger {
  color: var(--rk-danger);
  font-weight: 500;
}

.rk-action-sheet-item.is-cancel {
  font-weight: 600;
}

.rk-action-sheet-item:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}
</style>
