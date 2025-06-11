<template>
  <div class="member-control-container">
    <TUIButton
      v-if="singleControl"
      type="primary"
      @click="() => singleControl?.handler(userInfo)"
    >
      {{ singleControl?.title }}
    </TUIButton>
    <div
      v-if="moreControlList.length > 0"
      ref="moreBtnRef"
      class="more-container"
    >
      <TUIButton @click="toggleClickMoreBtn">
        {{ t('More') }}
        <IconArrowUp
          size="12"
          :class="['more-arrow', showMoreControl ? 'up' : 'down']"
        />
      </TUIButton>
      <div
        v-show="showMoreControl"
        id="operate-list"
        ref="operateListRef"
        :class="['user-operate-list', dropdownClass]"
      >
        <div
          v-for="item in moreControlList"
          :key="item.key"
          class="user-operate-item"
          :style="item.style || {}"
          @click="() => item.handler(userInfo)"
        >
          <TUIIcon v-if="item.icon" :icon="item.icon" />
          <span class="operate-text">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, defineProps } from 'vue';
import {
  TUIButton,
  IconArrowUp,
  TUIIcon,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomStore } from '../../../../stores/room';
import { useI18n } from '../../../../locales';
import { UserInfo, useUserState } from '../../../../core';

interface Props {
  userInfo: UserInfo;
}

const props = defineProps<Props>();
const { t } = useI18n();

const roomStore = useRoomStore();
const isMe = computed(
  () => props.userInfo.userId === roomStore.localUser.userId
);

const { useUserActions } = useUserState();

const userActions = useUserActions({
  userInfo: props.userInfo,
});

const singleControl = computed(() => {
  return isMe.value ? null : userActions?.[0];
});

const moreControlList = computed(() => {
  return isMe.value ? userActions : userActions.slice(1);
});
const dropdownClass = ref('down');
const moreBtnRef = ref();
const operateListRef = ref();
const showMoreControl = ref(false);

watch(
  () => moreControlList.value.length,
  moreControlListLength => {
    if (moreControlListLength === 0) {
      showMoreControl.value = false;
    }
  }
);

async function toggleClickMoreBtn() {
  if (showMoreControl.value) {
    showMoreControl.value = false;
  } else {
    await handleDropDownPosition();
    showMoreControl.value = true;
  }
}

async function handleDropDownPosition() {
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { top, bottom } = moreBtnRef.value?.getBoundingClientRect();
  const { top: containerTop, bottom: containerBottom } = document
    .getElementById('memberListContainer')
    ?.getBoundingClientRect() as DOMRect;
  if (!containerBottom || !containerTop) {
    return;
  }
  const bottomSize = containerBottom - bottom;
  const topSize = top - containerTop;
  let dropDownContainerHeight = 0;
  if (!showMoreControl.value) {
    operateListRef.value.style =
      'display:block;position:absolute;z-index:-1000';
    await nextTick();
    dropDownContainerHeight = operateListRef.value.offsetHeight;
    operateListRef.value.style = '';
  } else {
    dropDownContainerHeight = operateListRef.value?.offsetHeight;
  }
  if (topSize < dropDownContainerHeight) {
    return;
  }
  if (bottomSize < dropDownContainerHeight) {
    dropdownClass.value = 'up';
  }
}
</script>

<style lang="scss" scoped>
.member-control-container {
  display: flex;
  flex-direction: row;

  .more-arrow {
    margin-left: 2px;

    &.down {
      transform: rotate(180deg);
    }
  }

  .more-container {
    position: relative;
    margin-left: 10px;

    .user-operate-list {
      position: absolute;
      z-index: 1;
      min-width: 160px;
      padding: 20px;
      background-color: var(--dropdown-color-default);
      border-radius: 8px;
      box-shadow:
        0 3px 8px var(--uikit-color-black-8),
        0 6px 40px var(--uikit-color-black-8);

      &::before {
        position: absolute;
        width: 0;
        content: '';
        border-top: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid var(--dropdown-color-default);
        border-left: 10px solid transparent;
      }

      &::after {
        position: absolute;
        width: 100%;
        height: 20px;
        content: '';
        background-color: transparent;
      }

      .user-operate-item {
        display: flex;
        align-items: center;
        height: 20px;
        color: var(--text-color-secondary);
        cursor: pointer;

        .operate-text {
          margin-left: 10px;
          font-size: 14px;
          white-space: nowrap;
        }

        &:not(:first-child) {
          margin-top: 20px;
        }
      }
    }

    .down {
      top: calc(100% + 15px);
      right: 0;

      &::before {
        top: -20px;
        right: 20px;
      }

      &::after {
        top: -20px;
        left: 0;
      }
    }

    .up {
      right: 0;
      bottom: calc(100% + 15px);

      &::before {
        right: 20px;
        bottom: -20px;
        transform: rotate(180deg);
      }

      &::after {
        bottom: -20px;
        left: 0;
      }
    }
  }
}

.dialog-content {
  display: flex;
  align-items: center;

  .dialog-input {
    flex-grow: 1;
  }
}
</style>
