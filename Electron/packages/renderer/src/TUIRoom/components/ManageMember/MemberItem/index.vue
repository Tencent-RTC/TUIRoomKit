<template>
  <div
    v-if="userInfo.userId.indexOf('share_') < 0"
    class="member-item-container"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <member-info :user-info="userInfo" :show-member-control="showMemberControl"></member-info>
    <member-control v-show="showMemberControl" :user-info="userInfo"></member-control>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import memberInfo from './memberInfo.vue';
import memberControl from './memberControl.vue';
import { UserInfo } from '../../../stores/room';

interface Props {
  userInfo: UserInfo,
}

defineProps<Props>();

const showMemberControl = ref(false);

function handleMouseEnter() {
  showMemberControl.value = true;
}

function handleMouseLeave() {
  showMemberControl.value = false;
}

</script>

<style lang="scss">
.member-item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 69px;
  justify-content: space-between;
  padding: 0 32px;
  &:hover {
    cursor: pointer;
    background: rgba(46,50,61,0.70);
  }
}
</style>

