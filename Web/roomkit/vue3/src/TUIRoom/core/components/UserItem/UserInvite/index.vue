<template>
  <div class="member-invite-container">
    <TUIButton
      v-if="memberInviteControl.type === 'control'"
      type="primary"
      @click="memberInviteControl.handler"
    >
      {{ memberInviteControl?.label }}
    </TUIButton>
    <span v-if="memberInviteControl.type === 'info'" class="member-invite-info">
      {{ memberInviteControl?.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { UserInfo } from '../../../../core';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
// todo: 这里需要讨论邀请入会的逻辑是否单独抽离出来
import useMemberInviteAction from '../../../../core/hooks/useUserState/useUserActions/useMemberInviteAction';

interface Props {
  userInfo: UserInfo;
}
const props = defineProps<Props>();

// todo: 当前 invite 的业务逻辑太不通用了，考虑把 hooks 中的拒绝逻辑提取出来
const memberInviteControl = useMemberInviteAction(props.userInfo);
</script>

<style lang="scss" scoped>
.member-invite-container {
  display: flex;
  justify-content: end;
  width: 100%;

  .member-invite-info {
    display: flex;
    align-items: center;
    padding-right: 10px;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-primary);
  }

  .button {
    width: 68px;
  }
}
</style>
