<template>
  <div>
    <div
      v-if="!isGeneralUser && activeCategoryKey !== 'notEnteredUser'"
      class="global-setting"
    >
      <TUIButton
        type="primary"
        color="gray"
        style="min-width: 112px"
        @click="roomAudioAction.handler"
      >
        {{ roomAudioAction.label }}
      </TUIButton>
      <TUIButton
        type="primary"
        color="gray"
        style="min-width: 112px"
        @click="roomVideoAction.handler"
      >
        {{ roomVideoAction.label }}
      </TUIButton>
      <div class="more-container" v-click-outside="handleShowMoreControl">
        <TUIButton
          type="primary"
          color="gray"
          style="min-width: 112px"
          @click="toggleClickMoreBtn"
        >
          {{ t('More') }}
          <IconArrowUp
            size="12"
            :class="['more-arrow', showMoreControl ? 'up' : 'down']"
          />
        </TUIButton>
        <div v-show="showMoreControl" class="drop-down">
          <div
            v-for="item in moreControlList"
            :key="item.key"
            class="user-operate-item"
            @click="item.handler"
          >
            <svg-icon :icon="item.icon" />
            <span class="operate-text">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="activeCategoryKey === 'notEnteredUser'" class="global-setting">
      <TUIButton
        v-if="userCategoryNumber > 0"
        type="primary"
        @click="handleCallAllInvitee"
        :style="{ minWidth: '80%' }"
      >
        {{ t('Call all') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import useIndex from './useIndexHooks';
import vClickOutside from '../../../../directives/vClickOutside';
import {
  TUIButton,
  IconArrowUp,
} from '@tencentcloud/uikit-base-component-vue3';
interface Props {
  activeCategoryKey: string;
  userCategoryNumber: number;
}

defineProps<Props>();

const {
  t,
  isGeneralUser,
  roomAudioAction,
  roomVideoAction,
  moreControlList,
  toggleClickMoreBtn,
  showMoreControl,
  handleCallAllInvitee,
} = useIndex();

const handleShowMoreControl = () => {
  if (showMoreControl.value) {
    showMoreControl.value = false;
  }
};
</script>

<style scoped lang="scss">
.more-container {
  position: relative;
  display: flex;
  margin-left: 16px;

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

.global-setting {
  display: flex;
  justify-content: space-around;
  margin: 20px;
  cursor: pointer;
}
</style>
