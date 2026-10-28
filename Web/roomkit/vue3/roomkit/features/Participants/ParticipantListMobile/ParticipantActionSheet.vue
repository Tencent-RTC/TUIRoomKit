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
import { TUIPopup } from '../../../base';
import type { ParticipantSheetItem } from '../participantData';

defineProps<{
  open: boolean;
  groups: ParticipantSheetItem[][];
  /** Rule between rows, for the host's text-only list. */
  split?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  'select': [key: string];
}>();
</script>

<style scoped lang="scss" src="./ParticipantActionSheet.scss"></style>
