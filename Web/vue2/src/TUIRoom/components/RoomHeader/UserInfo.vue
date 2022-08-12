<template>
  <div ref="userInfoRef" class="user-info-container">
    <div class="user-info-content" @click="handleUserControl">
      <img class="avatar" :src="userAvatar || defaultAvatar">
      <div class="name">{{ userName || userId }}</div>
      <svg-icon class="down-icon" :icon-name="iconName" size="medium"></svg-icon>
    </div>
    <div v-if="showUserControl" class="user-control-container">
      <div class="user-control-item" @click="$emit('log-out')">退出登录</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import defaultAvatar from '../../assets/imgs/avatar.png';
import { ICON_NAME } from '../../constants/icon';

interface Props {
  userId: string,
  userName: string,
  userAvatar?: string,
}

defineProps<Props>();
defineEmits(['log-out']);

const userInfoRef = ref();
const showUserControl = ref(false);
const iconName = computed(() => (showUserControl.value ? ICON_NAME.LineArrowUp : ICON_NAME.LineArrowDown));

function handleUserControl() {
  showUserControl.value = !showUserControl.value;
}

function hideUserControl(event: Event) {
  if (!userInfoRef.value.contains(event.target)) {
    showUserControl.value = false;
  }
}

onMounted(() => {
  window.addEventListener('click', hideUserControl);
});

onUnmounted(() => {
  window.removeEventListener('click', hideUserControl);
});
</script>

<style lang="scss" scoped>
.user-info-container {
  position: relative;
  .user-info-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
    .name {
      max-width: 100px;
      margin-left: 20px;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .down-icon {
      margin-left: 4px;
    }
  }
  .user-control-container {
    background: rgba(46,50,61,0.60);
    padding: 10px 0;
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    border-radius: 4px;
    .user-control-item {
      width: 104px;
      text-align: center;
      font-size: 14px;
      cursor: pointer;
      height: 20px;
    }
  }
}
</style>
