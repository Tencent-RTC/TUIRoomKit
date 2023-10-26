<template>
  <div class="avatar-container">
    <img class="avatar" :src="imgSrc || defaultAvatar" :onerror="showDefaultAvatar">
  </div>
</template>

<script setup lang="ts">
import defaultAvatar from '../../assets/imgs/avatar.png';

interface Props {
  imgSrc?: string | undefined
}
defineProps<Props>();

function showDefaultAvatar(e:any) {
  e.target.src = defaultAvatar;
}

</script>

<style lang="scss" scoped>
.avatar-container {
  position: relative;
  .avatar {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    width: 100%;
    height: 100%;
  }
}
</style>
