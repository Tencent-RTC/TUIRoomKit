<template>
  <div class="member-control-container">
    <tui-button
      class="button"
      size="default"
      @click="singleControl.func(props.userInfo)"
      v-if="!isCanOperateMySelf"
    >
      {{ singleControl?.title }}
    </tui-button>
    <div ref="moreBtnRef" class="more-container">
      <tui-button class="button" type="primary" @click="toggleClickMoreBtn">
        {{ t('More') }}
        <svg-icon
          size="12"
          :class="['more-arrow', showMoreControl ? 'up' : 'down']"
          :icon="ArrowUpIcon"
        />
      </tui-button>
      <div
        v-show="showMoreControl"
        id="operate-list"
        ref="operateListRef"
        :class="['user-operate-list', 'tui-theme-white', dropdownClass]"
      >
        <div
          v-for="item in moreControlList"
          :key="item.key"
          class="user-operate-item"
          @click="item.func(props.userInfo)"
        >
          <svg-icon :icon="item.icon" />
          <span class="operate-text">{{ item.title }}</span>
        </div>
      </div>
    </div>
    <Dialog
      v-model="isDialogVisible"
      :title="dialogData.title"
      :modal="true"
      width="480px"
      :before-close="handleCancelDialog"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <div class="dialog-content">
        <span>{{ dialogData.content }}</span>
        <tui-input
          v-if="dialogData.showInput"
          v-model="tempUserName"
          class="dialog-input"
          :placeholder="t('Please input user name')"
        />
      </div>
      <template #footer>
        <tui-button
          size="default"
          @click="handleAction(props.userInfo)"
          :disabled="tempUserName.length === 0"
        >
          {{ dialogData.confirmText }}
        </tui-button>
        <tui-button
          class="cancel"
          size="default"
          type="primary"
          @click="handleCancelDialog"
        >
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useI18n } from '../../../locales';
import TuiButton from '../../common/base/Button.vue';
import Dialog from '../../common/base/Dialog';
import TuiInput from '../../common/base/Input';
import SvgIcon from '../../common/base/SvgIcon.vue';
import ArrowUpIcon from '../../common/icons/ArrowUpIcon.vue';
import useMemberControlHooks from './useMemberControlHooks';
import useMemberItemHooks from '../MemberItem/useMemberItemHooks';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo;
  showMemberControl: boolean;
}

const props = defineProps<Props>();

const { t } = useI18n();
const {
  controlList,
  handleCancelDialog,
  handleAction,
  isDialogVisible,
  dialogData,
  tempUserName,
} = useMemberControlHooks(props);

const { isCanOperateMySelf } = useMemberItemHooks(props.userInfo);

const singleControl = computed(() => controlList.value[0]);
const moreControlList = computed(() => {
  return isCanOperateMySelf ? controlList.value : controlList.value.slice(1);
});
const dropdownClass = ref('down');
const moreBtnRef = ref();
const operateListRef = ref();
const showMoreControl = ref(false);

watch(
  () => props.showMemberControl,
  val => {
    if (!val) {
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
.tui-theme-black .user-operate-list {
  --operation-font-color: var(--font-color-1);
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.3),
    0px 6px 40px rgba(34, 38, 46, 0.3);
}

.tui-theme-white .user-operate-list {
  --operation-font-color: #6b758a;
  --operation-box-shadow: 0px 3px 8px #e9f0fb, 0px 6px 40px rgba(0, 0, 0, 0.1);
}

.member-control-container {
  display: flex;
  flex-direction: row;

  .button {
    height: 32px;
    padding: 0 10px;
    margin-left: 10px;

    .more-arrow {
      margin-left: 2px;

      &.down {
        transform: rotate(180deg);
      }
    }
  }

  .more-container {
    position: relative;

    .user-operate-list {
      position: absolute;
      z-index: 1;
      min-width: 160px;
      padding: 20px;
      background: var(--background-color-1);
      border-radius: 8px;
      box-shadow: var(--operation-box-shadow);

      &::before {
        position: absolute;
        width: 0;
        content: '';
        border-top: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid var(--background-color-1);
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
        color: var(--operation-font-color);
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

.cancel {
  margin-left: 12px;
}
</style>
