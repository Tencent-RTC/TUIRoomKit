<template>
  <TUIPopup :open="open" height="auto" @update:open="emit('update:open', $event)">
    <div class="participant-action-sheet" role="menu">
      <div
        v-for="(group, groupIndex) in groups"
        :key="groupIndex"
        class="participant-action-sheet-group"
        :class="{ 'is-split': split }"
      >
        <div
          v-for="item in group"
          :key="item.key"
          class="participant-action-sheet-item"
          :class="{ 'is-danger': item.danger, 'is-active': item.active }"
          role="menuitem"
          tabindex="0"
          @click="emit('select', item.key)"
          @keydown.enter.prevent="emit('select', item.key)"
        >
          <component :is="item.icon" v-if="item.icon" :size="15" />
          <span class="participant-action-sheet-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { TUIPopup } from '../../../base';

export interface ParticipantActionItem {
  key: string;
  label: string;
  /** Member actions carry an icon; the host's room-wide toggles are text only. */
  icon?: Component;
  danger?: boolean;
  /** A room-wide toggle that is currently on reads in the accent colour. */
  active?: boolean;
}

defineProps<{
  open: boolean;
  groups: ParticipantActionItem[][];
  /** Rule between rows, for the host's text-only list. */
  split?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'select': [key: string];
}>();
</script>

<style scoped lang="scss">
.participant-action-sheet {
  padding: 4px 0 24px;
}

.participant-action-sheet-group + .participant-action-sheet-group {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid var(--rk-border);
}

.participant-action-sheet-item {
  box-sizing: border-box;
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 42px;
  padding: 9px 12px;
  font-size: var(--rk-fs-md);
  line-height: 1.35;
  color: var(--rk-text-primary);
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.participant-action-sheet-item:active {
  background: var(--rk-bg-hover);
}

.participant-action-sheet-group.is-split .participant-action-sheet-item + .participant-action-sheet-item {
  border-top: 1px solid var(--rk-border);
}

.participant-action-sheet-item.is-active {
  color: var(--rk-brand);
}

.participant-action-sheet-item.is-danger {
  color: var(--rk-danger);
}

.participant-action-sheet-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
