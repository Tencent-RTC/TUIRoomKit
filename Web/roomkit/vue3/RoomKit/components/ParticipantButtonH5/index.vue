<template>
  <IconButtonH5 :title="title" @click="isPopupVisible = true">
    <IconManageMember size="24" />
  </IconButtonH5>

  <TUIPopup v-model:visible="isPopupVisible" height="90%">
    <div class="participant-list-content">
      <PopUpArrowDown @click="isPopupVisible = false" />
      <div class="participant-list-header">
        {{ title }}
      </div>
      <RoomParticipantListH5 />
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUIKit, IconManageMember, TUIPopup } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState, RoomParticipantListH5 } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';

const { t } = useUIKit();
const { currentRoom } = useRoomState();

const isPopupVisible = ref(false);
const title = computed(() => {
  if (!currentRoom.value) {
    return t('Participant.Title');
  }
  return `${t('Participant.Title')}(${currentRoom.value?.participantCount})`;
});
</script>

<style lang="scss" scoped>
.participant-list-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  -webkit-tap-highlight-color: transparent;

  .participant-list-header {
    font-size: 16px;
    font-weight: 600;
    padding: 12px 20px;
  }
}
</style>
