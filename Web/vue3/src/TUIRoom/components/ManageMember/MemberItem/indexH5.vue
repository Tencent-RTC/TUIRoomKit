<template>
  <div
    :ref="(el) => setMemberItemRef(el)"
    v-tap="handleMemberItemClick"
    class="member-item-container"
  >
    <member-info :ref="(el) => setMemberInfoRef(el)" :show-state-icon="true" :user-info="userInfo"></member-info>
    <member-control
      v-show="showMemberControl"
      :ref="(el) => setMemberControlRef(el)"
      :user-info="userInfo"
      @on-close-control="handleCloseControl"
    ></member-control>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl';
import { UserInfo } from '../../../stores/room';
import useMemberItem from './useMemberItemHooks';
import vTap from '../../../directives/vTap';

const {
  showMemberControl,
  setMemberItemRef,
  setMemberInfoRef,
  setMemberControlRef,
  handleMemberItemClick,
  handleDocumentClick,
  handleCloseControl,
} = useMemberItem();

interface Props {
  userInfo: UserInfo,
}

defineProps<Props>();

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});

</script>

<style lang="scss" scoped>
.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 69px;
  padding: 0 32px;
  justify-content: space-between;
  &:hover {
    cursor: pointer;
    background: var(--member-item-container-hover-bg-color);
  }
}
</style>
