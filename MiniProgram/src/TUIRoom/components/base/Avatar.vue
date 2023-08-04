<template>
  <img class="default-avatar" :src="imgSrc || defaultAvatar" :onerror="showDefaultAvatar">
</template>

<script setup lang="ts">
import defaultAvatar from '../../assets/imgs/avatar.png';

interface Props {
  imgSrc?: string | undefined
}
const props = defineProps<Props>();

function showDefaultAvatar(e:any) {
  e.target.src = defaultAvatar;
}

</script>

<style>
.default-avatar {
  border-radius: 50%;
  width: 48px;
  height: 48px;
}
</style>
