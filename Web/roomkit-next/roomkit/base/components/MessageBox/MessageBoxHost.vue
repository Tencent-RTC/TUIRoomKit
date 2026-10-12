<template>
  <TUIDialog
    v-for="item in items"
    :key="item.id"
    :open="openMap[item.id] !== false"
    :title="item.options.title"
    :closable="item.options.closable === true"
    :close-on-overlay="item.options.closeOnOverlay !== false"
    :close-on-esc="item.options.closeOnEsc !== false"
    :confirm-text="item.options.confirmText ?? t('Confirm')"
    :confirm-variant="item.mode === 'danger' ? 'danger' : 'primary'"
    :cancel-text="item.mode === 'alert' ? '' : (item.options.cancelText ?? t('Cancel'))"
    @update:open="(open) => { if (!open) handleClose(item.id, 'close'); }"
    @confirm="handleClose(item.id, 'confirm')"
    @cancel="handleClose(item.id, 'cancel')"
    @close="handleClose(item.id, 'close')"
  >
    {{ item.options.message }}
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, inject, reactive, watch } from 'vue';
import { t } from '../../i18n';
import { OVERLAY_CONTEXT_KEY } from '../../tokens';
import { getMessageBoxStore } from './store';
import TUIDialog from '../Dialog/index.vue';

const ctx = inject(OVERLAY_CONTEXT_KEY, null);
const store = ctx ? getMessageBoxStore(ctx) : null;
const items = computed(() => store?.items.value ?? []);
const openMap = reactive<Record<number, boolean>>({});

watch(items, (list) => {
  list.forEach((item) => {
    if (openMap[item.id] === undefined) {
      openMap[item.id] = true;
    }
  });
});

function handleClose(id: number, action: 'confirm' | 'cancel' | 'close') {
  openMap[id] = false;
  setTimeout(() => store?.close(id, action), 200);
}
</script>
