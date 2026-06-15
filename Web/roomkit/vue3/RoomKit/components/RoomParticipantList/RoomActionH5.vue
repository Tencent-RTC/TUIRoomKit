<template>
  <div v-if="canOperate" class="room-action-h5-container">
    <TUIButton
      type="primary"
      color="gray"
      class="action-button"
      @click="roomAudioAction.handler"
    >
      {{ roomAudioAction.label }}
    </TUIButton>
    <TUIButton
      type="primary"
      color="gray"
      class="action-button"
      @click="roomVideoAction.handler"
    >
      {{ roomVideoAction.label }}
    </TUIButton>
    <TUIButton
      v-if="moreControlList.length > 0"
      type="primary"
      color="gray"
      class="action-button"
      @click="showMorePopup = true"
    >
      {{ t('ParticipantList.More') }}
    </TUIButton>

    <!-- More actions popup -->
    <TUIPopup
      :visible="showMorePopup"
      @update:visible="showMorePopup = $event"
    >
      <PopUpArrowDown @click="showMorePopup = false" />
      <div class="more-actions-content">
        <div
          v-for="item in moreControlList"
          :key="item.key"
          class="action-item"
          @click="handleMoreActionClick(item.handler)"
        >
          <TUIIcon
            v-if="item.icon"
            :icon="item.icon"
            size="20"
            class="action-icon"
          />
          <span class="action-text">{{ item.label }}</span>
        </div>
      </div>
    </TUIPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  TUIButton,
  useUIKit,
  TUIIcon,
  TUIPopup,
} from '@tencentcloud/uikit-base-component-vue3';
import PopUpArrowDown from './PopUpArrowDown.vue';
import useRoomActions from './useRoomAction';

defineOptions({
  name: 'RoomActionH5',
});

const { t } = useUIKit();
const { canOperate, roomActionList } = useRoomActions();

const roomAudioAction = computed(() => roomActionList.value[0]);
const roomVideoAction = computed(() => roomActionList.value[1]);
const moreControlList = computed(() => roomActionList.value.slice(2));

const showMorePopup = ref(false);

function handleMoreActionClick(handler: () => void) {
  handler();
  showMorePopup.value = false;
}
</script>

<style scoped lang="scss">
.room-action-h5-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  -webkit-tap-highlight-color: transparent;

  .action-button {
    flex: 1;
    min-width: 0;
  }

  .more-arrow {
    margin-left: 4px;
    transform: rotate(180deg);
  }
}

.more-actions-content {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;

  .action-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s ease;
    gap: 12px;
    color: var(--text-color-secondary);

    &:active {
      background: var(--list-color-hover);
    }

    .action-icon {
      flex-shrink: 0;
    }

    .action-text {
      flex: 1;
      font-size: 16px;
      font-weight: 400;
      line-height: 22px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
