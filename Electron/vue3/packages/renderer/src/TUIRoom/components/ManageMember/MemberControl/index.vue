<template>
  <div v-if="!isMe" class="member-control-container">
    <tui-button class="button" size="default" @click="singleControl.func(props.userInfo)">
      {{ singleControl.title }}
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
        :class="['user-operate-list', 'tui-theme-white', dropdownClass ]"
      >
        <div
          v-for="item, index in moreControlList"
          :key="index"
          class="user-operate-item"
          @click="item.func(props.userInfo)"
        >
          <svg-icon :icon="item.icon"></svg-icon>
          <span class="operate-text">{{ item.title }}</span>
        </div>
      </div>
    </div>
    <Dialog
      v-model="showKickOffDialog"
      :title="t('Note')"
      :modal="true"
      width="480px"
      :before-close="handleCancelKickOffDialog"
      :close-on-click-modal="true"
      :append-to-room-container="true"
    >
      <span>{{ kickOffDialogContent }}</span>
      <template #footer>
        <tui-button size="default" @click="kickOffUser(props.userInfo)"> {{ t('Confirm') }} </tui-button>
        <tui-button class="cancel" size="default" type="primary" @click="handleCancelKickOffDialog"> {{ t('Cancel') }}</tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from '../../../locales';
import TuiButton from '../../common/base/Button.vue';
import Dialog from '../../common/base/Dialog/index.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import ArrowUpIcon from '../../common/icons/ArrowUpIcon.vue';
import useMemberControlHooks from './useMemberControlHooks';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo,
  showMemberControl: boolean,
}

const props = defineProps<Props>();

const { t } = useI18n();
const {
  isMe,
  controlList,
  showKickOffDialog,
  kickOffDialogContent,
  kickOffUser,
  handleCancelKickOffDialog,
} = useMemberControlHooks(props);

const singleControl = computed(() => controlList.value[0]);
const moreControlList = computed(() => controlList.value.slice(1));
const dropdownClass = ref('down');
const moreBtnRef = ref();
const operateListRef = ref();
const showMoreControl = ref(false);

watch(() => props.showMemberControl, (val) => {
  if (!val) {
    showMoreControl.value = false;
  }
});

function toggleClickMoreBtn() {
  if (showMoreControl.value) {
    showMoreControl.value = false;
  } else {
    handleDropDownPosition();
    showMoreControl.value = true;
  }
}

// 根据页面位置确定下拉框的定位
function handleDropDownPosition() {
  const { top, bottom } = moreBtnRef.value?.getBoundingClientRect();
  const containerBottom = document.getElementById('memberListContainer')?.getBoundingClientRect()?.bottom;
  if (!containerBottom) {
    return;
  }
  const bottomSize = containerBottom - bottom;
  let dropDownContainerHeight = 0;
  if (!showMoreControl.value) {
    operateListRef.value.style = 'display:block;position:absolute;z-index:-1000';
    dropDownContainerHeight = operateListRef.value.offsetHeight;
    operateListRef.value.style = '';
  } else {
    dropDownContainerHeight = operateListRef.value?.offsetHeight;
  }
  if (bottomSize < top && bottomSize < dropDownContainerHeight) {
    dropdownClass.value = 'up';
  }
}

</script>

<style lang="scss" scoped>

.tui-theme-black .user-operate-list {
  --operation-font-color: var(--font-color-1);
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.30), 0px 6px 40px rgba(34, 38, 46, 0.30);
}

.tui-theme-white .user-operate-list {
  --operation-font-color: #6B758A;
  --operation-box-shadow: 0px 3px 8px #E9F0FB, 0px 6px 40px rgba(0, 0, 0, 0.10);
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
      padding: 20px;
      min-width: 160px;
      background: var(--background-color-1);
      border-radius: 8px;
      box-shadow: var(--operation-box-shadow);
      z-index: 1;
      &::before {
        content: '';
        position: absolute;
        width: 0px;
        border-top: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid var(--background-color-1);
        border-left: 10px solid transparent;
      }
      &::after {
        content: '';
        width: 100%;
        height: 20px;
        position: absolute;
        background-color: transparent;
      }
      .user-operate-item {
        cursor: pointer;
        color: var(--operation-font-color);
        height: 20px;
        display: flex;
        align-items: center;
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
        right: 20px;
        top: -20px;
      }
      &::after {
        left: 0px;
        top: -20px;
      }
    }
    .up {
      bottom: calc(100% + 15px);
      right: 0;
      &::before {
        bottom: -20px;
        right: 20px;
        transform: rotate(180deg);
      }
      &::after {
        left: 0px;
        bottom: -20px;
      }
    }
  }
}
.cancel {
  margin-left: 12px;
}

</style>
