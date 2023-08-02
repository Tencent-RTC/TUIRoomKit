<template>
  <div
    class="member-item-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <member-info :user-info="userInfo" :show-state-icon="!showMemberControl"></member-info>
    <member-control v-show="showMemberControl" :user-info="userInfo"></member-control>
  </div>
</template>

<script setup lang="ts">
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl/index.vue';
import { UserInfo } from '../../../stores/room';
import useMemberItem from './useMemberItemHooks';

const {
  showMemberControl,
  handleMouseEnter,
  handleMouseLeave,
} = useMemberItem();

interface Props {
  userInfo: UserInfo,
}

defineProps<Props>();


</script>

<style lang="scss" scoped>
.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 69px;
  justify-content: space-between;
  padding: 0 32px;
  &:hover {
    cursor: pointer;
    background: var(--member-item-container-hover-bg-color);
  }
}
</style>
