<template>
  <div
    ref="memberItemContainerRef"
    v-tap="handleOpenMemberControl"
    class="member-item-container"
  >
    <member-info :show-state-icon="true" :user-info="props.userInfo" />
    <member-control
      v-show="showMemberControl"
      :show-member-control="showMemberControl"
      :user-info="props.userInfo"
      @on-close-control="handleDocumentTouchend"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl';
import { UserInfo } from '../../../stores/room';
import useMemberItem from './useMemberItemHooks';
import vTap from '../../../directives/vTap';

interface Props {
  userInfo: UserInfo;
}
const props = defineProps<Props>();

const memberItemContainerRef = ref();

const { isMemberControlAccessible, openMemberControl, closeMemberControl } =
  useMemberItem(props.userInfo);
const showMemberControl = ref(false);
watch(isMemberControlAccessible, (accessible: boolean) => {
  if (accessible === false) {
    showMemberControl.value = false;
  }
});

const handleOpenMemberControl = (event: MouseEvent | TouchEvent) => {
  event.stopPropagation();
  openMemberControl();
  if (isMemberControlAccessible.value === true) {
    showMemberControl.value = true;
  }
};

const handleDocumentTouchend = (event: any) => {
  if (memberItemContainerRef.value?.contains(event?.target)) {
    return;
  }
  closeMemberControl();
  showMemberControl.value = false;
};
onMounted(() => {
  document.addEventListener('touchend', handleDocumentTouchend);
});

onUnmounted(() => {
  document.removeEventListener('touchend', handleDocumentTouchend);
});
</script>

<style lang="scss" scoped>
.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 69px;
  padding: 0 32px;

  &:hover {
    background: var(--member-item-container-hover-bg-color);
  }
}
</style>
