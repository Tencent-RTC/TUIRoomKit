<template>
  <ToolbarButtonPC
    :label="t('Participants.Panel')"
    :active="active"
    @click="handleClick"
  >
    <template #icon>
      <IconMembers :size="22" />
      <span class="participant-button-badge">{{ count }}</span>
    </template>
  </ToolbarButtonPC>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconMembers, t } from '../../../base';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';
import { useParticipantList } from '../ParticipantListPC/useParticipant';

withDefaults(defineProps<{ active?: boolean }>(), { active: false });
const emit = defineEmits<{ click: [] }>();

const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
const { refreshParticipants } = useParticipantList();
const count = computed(() => currentRoom.value?.participantCount || participantList.value.length);

function handleClick() {
  void refreshParticipants();
  emit('click');
}
</script>

<style scoped lang="scss">
/* Float the count outside the glyph so the rear person stays visible. */
.participant-button-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.02em;
}
</style>
