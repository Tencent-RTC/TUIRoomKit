<template>
  <div
    class="member-item-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <user-info-comp
      :user-info="props.userInfo"
      :show-state-icon="props.userInfo.isInRoom && !showUserAction"
    />
    <user-invite v-if="!userInfo.isInRoom" :user-info="props.userInfo" />
    <user-action v-show="showUserAction" :user-info="props.userInfo" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps } from 'vue';
import UserInfoComp from './UserInfo/index.vue';
import UserInvite from './UserInvite/index.vue';
import UserAction from './UserAction';
import { useUserState, UserInfo } from '../../../core';

interface Props {
  userInfo: UserInfo;
}

const props = defineProps<Props>();

const isMouseHover = ref(false);

function handleMouseEnter() {
  isMouseHover.value = true;
}

function handleMouseLeave() {
  isMouseHover.value = false;
}
const { useUserActions } = useUserState();
const userActions = useUserActions({ userInfo: props.userInfo });
const showUserAction = computed(
  () => isMouseHover.value && props.userInfo.isInRoom && userActions?.length > 0
);
</script>

<style lang="scss" scoped>
.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 20px;

  &:hover {
    cursor: pointer;
    background-color: var(--list-color-hover);
  }
}
</style>
