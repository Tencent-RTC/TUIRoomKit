<template>
  <div class="avatar-container">
    <img class="avatar" :src="src" :onerror="handleError" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import defaultAvatar from '../../assets/imgs/avatar.png';

interface Props {
  imgSrc?: string | undefined;
}
const props = defineProps<Props>();
const src = computed(() => {
  if (isError.value) {
    return defaultAvatar;
  }
  return props.imgSrc || defaultAvatar;
});
const isError = ref(false);
function handleError() {
  isError.value = true;
}
</script>

<style lang="scss" scoped>
.avatar-container {
  position: relative;
  width: 100%;
  height: 100%;

  .avatar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
}
</style>
