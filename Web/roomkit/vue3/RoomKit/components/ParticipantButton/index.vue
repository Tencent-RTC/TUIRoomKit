<template>
  <IconButton :title="title" @click-icon="props.togglePanel?.()">
    <IconManageMember size="24" />
  </IconButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, IconManageMember } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

interface Props {
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  togglePanel: undefined,
});

const { t } = useUIKit();
const { currentRoom } = useRoomState();

const title = computed(() => {
  if (!currentRoom.value || !currentRoom.value?.roomId) {
    return t('Participant.Title');
  }
  const memberCount = (currentRoom.value?.participantCount || 0) + (currentRoom.value?.audienceCount || 0);
  if (memberCount === 0) {
    return t('Participant.Title');
  }
  return `${t('Participant.Title')}(${memberCount})`;
});
</script>
