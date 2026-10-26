<template>
  <ToolbarButtonMobile
    :label="t('Participants.Panel')"
    :active="active"
    :pressed="active"
    @click="emit('click')"
  >
    <IconMembers :size="20" />
    <template #badge>
      <span class="participant-button-mobile-count" aria-hidden="true">{{ countLabel }}</span>
    </template>
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconMembers, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';
import { useParticipantList } from '../ParticipantListMobile/useParticipantList';

withDefaults(defineProps<{ active?: boolean }>(), { active: false });
const emit = defineEmits<{ click: [] }>();

const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
// The member sheet mounts only when opened. This button stays up for the meeting.
useParticipantList();
const count = computed(() => currentRoom.value?.participantCount || participantList.value.length);
const countLabel = computed(() => (count.value > 99 ? '99+' : String(count.value)));
</script>

<style scoped lang="scss">
/* Anchored to the 44px button, not the icon: lands inside the circle at its upper right. */
.participant-button-mobile-count {
  position: absolute;
  bottom: calc(50% + 6px);
  left: calc(50% + 8px);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 12px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--rk-text-primary);
  letter-spacing: -0.03em;
  white-space: nowrap;
  pointer-events: none;
}
</style>
