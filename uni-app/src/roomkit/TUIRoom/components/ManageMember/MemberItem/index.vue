<template>
  <div
    ref="memberItemContainerRef"
    class="member-item-container"
    @tap="handleOpenMemberControl"
  >
    <member-info :show-state-icon="true" :user-info="props.userInfo"></member-info>
    <member-control
      v-if="showMemberControl"
      :show-member-control="showMemberControl"
      :user-info="props.userInfo"
      @on-close-control="handleDocumentTouchend"
    ></member-control>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import MemberInfo from '../MemberItemCommon/MemberInfo.vue';
import MemberControl from '../MemberControl/index.vue';
import { UserInfo } from '../../../stores/room';
import { isH5 } from '../../../utils/environment';
import useMemberItem from './useMemberItemHooks';


interface Props {
  userInfo: UserInfo,
}
const props = defineProps<Props>();

const memberItemContainerRef = ref();

const {
  isMemberControlAccessible,
  openMemberControl,
  closeMemberControl,
} = useMemberItem(props.userInfo);
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
  if (isH5 && memberItemContainerRef.value?.contains(event?.target)) {
    return;
  }
  closeMemberControl();
  showMemberControl.value = false;
};
onMounted(() => {
  document?.addEventListener('touchend', handleDocumentTouchend);
});

onUnmounted(() => {
  document?.removeEventListener('touchend', handleDocumentTouchend);
});

</script>

<style lang="scss" scoped>
.member-item-container {
	width: 750rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 69px;
  padding: 0 32px;
  &:hover {
    background: #F3F3F3;
  }
}
</style>
