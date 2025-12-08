<template>
  <IconButton :title="title">
    <IconManageMember size="24" />
  </IconButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, IconManageMember } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../base/IconButton.vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { currentRoom } = useRoomState();

const title = computed(() => {
  if (!currentRoom.value) {
    return t('Participant.Title');
  }
  return t('Participant.Title') + `(${currentRoom.value?.participantCount})`;
})
</script>
