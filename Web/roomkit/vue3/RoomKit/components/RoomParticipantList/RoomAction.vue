<template>
  <div v-if="canOperate" class="room-action-container">
    <template v-if="!isWebinar">
      <TUIButton
        type="primary"
        color="gray"
        style="width: 112px"
        @click="roomAudioAction.handler"
      >
        {{ roomAudioAction.label }}
      </TUIButton>
      <TUIButton
        type="primary"
        color="gray"
        style="width: 112px"
        @click="roomVideoAction.handler"
      >
        {{ roomVideoAction.label }}
      </TUIButton>
      <div ref="moreContainerRef" class="more-container">
        <TUIButton
          type="primary"
          color="gray"
          style="width: 112px"
          @click="toggleClickMoreBtn"
        >
          {{ t('ParticipantList.More') }}
          <IconArrowUp
            size="12"
            :class="['more-arrow', showMoreControl ? 'down' : 'up']"
          />
        </TUIButton>
        <div v-show="showMoreControl" class="drop-down">
          <div
            v-for="item in moreControlList"
            :key="item.key"
            class="user-operate-item"
            @click="item.handler"
          >
            <TUIIcon v-if="item.icon" :icon="item.icon" />
            <span class="operate-text">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </template>
    <TUIButton
      v-else
      type="primary"
      color="gray"
      style="width: 100%"
      @click="roomAudioAction.handler"
    >
      {{ roomAudioAction.label }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  TUIButton,
  IconArrowUp,
  useUIKit,
  TUIIcon,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomType } from 'tuikit-atomicx-vue3';
import useRoomActions from './useRoomAction';

const { t } = useUIKit();
const { canOperate, roomActionList } = useRoomActions();
const { currentRoom } = useRoomState();

const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);
const roomAudioAction = computed(() => roomActionList.value[0]);
const roomVideoAction = computed(() => roomActionList.value[1]);
const moreControlList = computed(() => roomActionList.value.slice(2));

const showMoreControl = ref(false);
const moreContainerRef = ref<HTMLElement | null>(null);

function toggleClickMoreBtn() {
  showMoreControl.value = !showMoreControl.value;
}

const handleClickOutside = (event: MouseEvent) => {
  if (!showMoreControl.value) {
    return;
  }

  const target = event.target as Node;
  if (moreContainerRef.value && !moreContainerRef.value.contains(target)) {
    showMoreControl.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.room-action-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.more-container {
  position: relative;
  display: flex;

  .more-arrow {
    margin-left: 2px;

    &.down {
      transform: rotate(180deg);
    }
  }

  .drop-down {
    position: absolute;
    right: 3px;
    bottom: 40px;
    z-index: 1;
    padding: 8px 7px;
    background-color: var(--dropdown-color-default);
    border-radius: 8px;
    box-shadow:
      0 3px 8px var(--uikit-color-black-8),
      0 6px 40px var(--uikit-color-black-8);

    .user-operate-item {
      display: flex;
      align-items: center;
      height: 20px;
      margin: 5px 7px;
      color: var(--text-color-secondary);
      cursor: pointer;

      .operate-text {
        margin-left: 8px;
        font-family: 'PingFang SC';
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        white-space: nowrap;
      }
    }
  }
}
</style>
