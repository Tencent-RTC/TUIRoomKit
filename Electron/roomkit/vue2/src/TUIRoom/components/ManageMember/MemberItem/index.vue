<template>
  <div
    class="member-item-container"
    @mouseenter="openMemberControl"
    @mouseleave="closeMemberControl"
  >
    <member-info
      :user-info="props.userInfo"
      :show-state-icon="props.userInfo.isInRoom && !showMemberControl"
    />
    <member-control
      v-show="showMemberControl && props.userInfo.isInRoom"
      :show-member-control="showMemberControl"
      :user-info="props.userInfo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps } from 'vue';
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl/index.vue';
import { UserInfo } from '../../../stores/room';
import useMemberItem from './useMemberItemHooks';

interface Props {
  userInfo: UserInfo;
}

const props = defineProps<Props>();

const { isMemberControlAccessible, openMemberControl, closeMemberControl } =
  useMemberItem(props.userInfo);

const showMemberControl = ref(false);

watch(isMemberControlAccessible, (accessible: boolean) => {
  showMemberControl.value = accessible;
});
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
    background: var(--hover-bg-color);
  }
}

.tui-theme-black .member-item-container {
  --hover-bg-color: rgba(79, 88, 107, 0.2);
}

.tui-theme-white .member-item-container {
  --hover-bg-color: rgba(213, 224, 242, 0.3);
}
</style>
