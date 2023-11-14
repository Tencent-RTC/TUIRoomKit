<template>
  <div
    class="member-item-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <member-info :user-info="userInfo" :show-state-icon="!showMemberControl"></member-info>
    <member-control
      v-show="showMemberControl"
      :show-member-control="showMemberControl"
      :user-info="userInfo"
    ></member-control>
  </div>
</template>

<script setup lang="ts">
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl';
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
.tui-theme-black .member-item-container {
  --hover-bg-color: rgba(79, 88, 107, 0.2);
}
.tui-theme-white .member-item-container {
  --hover-bg-color: rgba(213, 224, 242, 0.3);
}

.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 52px;
  padding: 0 20px;
  justify-content: space-between;
  &:hover {
    cursor: pointer;
    background: var(--hover-bg-color);
  }
}
</style>
