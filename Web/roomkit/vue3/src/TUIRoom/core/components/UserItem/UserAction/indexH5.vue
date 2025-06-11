<template>
  <div class="member-control-container">
    <div class="member-title">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl" />
      <div class="member-title-content">
        {{ userInfo.displayName }}
      </div>
      <span v-if="isWeChat" v-tap.stop="handleCloseControl" class="tab-cancel">
        {{ t('Cancel') }}
      </span>
    </div>
    <div
      v-for="item in actionList"
      :key="item.key"
      v-tap="() => item.handler(userInfo)"
      class="user-operate-item"
    >
      <TUIIcon :icon="item.icon" class="icon-svg" />
      <div class="control-title">{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Avatar from '../../../../components/common/Avatar.vue';
import { TUIIcon } from '@tencentcloud/uikit-base-component-vue3';
import { isWeChat } from '../../../../utils/environment';
import vTap from '../../../../directives/vTap';
import { useI18n } from '../../../../locales';
import { UserInfo, useUserState } from '../../../../core';

interface Props {
  userInfo: UserInfo;
}

const props = defineProps<Props>();

const { t } = useI18n();

const emit = defineEmits(['on-close-control']);

const { useUserActions } = useUserState();
const actionList = useUserActions({ userInfo: props.userInfo });

function handleCloseControl() {
  emit('on-close-control');
}
</script>

<style lang="scss" scoped>
.member-control-container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column !important;
  width: 100%;
  padding: 22px 16px;
  background-color: var(--bg-color-operate);
  border-radius: 15px 15px 0 0;
  animation-name: popup;
  animation-duration: 200ms;

  @keyframes popup {
    from {
      transform: scaleY(0);
      transform-origin: bottom;
    }

    to {
      transform: scaleY(1);
      transform-origin: bottom;
    }
  }

  .member-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;

    .avatar-url {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }

    .member-title-content {
      margin-left: 10px;
      font-size: 16px;
      font-weight: 500;
      line-height: 22px;
      color: var(--text-color-primary);
    }
  }

  .user-operate-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding-top: 10px;

    .control-title {
      margin-left: 10px;
    }
  }
}

.cancel-button {
  display: flex;
  align-items: center;
  width: 50%;
  padding: 12px;
}

.tab-cancel {
  flex: 1;
  padding-right: 30px;
  text-align: end;
}
</style>
