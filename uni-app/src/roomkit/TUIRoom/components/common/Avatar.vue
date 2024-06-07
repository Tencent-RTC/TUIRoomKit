<template>
  <image class="avatar" :src="avatarSrc" @error="handleError" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import defaultAvatar from '../../assets/imgs/avatar.png';

interface Props {
  imgSrc?: string | undefined;
  size: number;
}
const props = defineProps<Props>();
const avatarSrc = computed(() => {
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
.avatar {
		flex: 1;
    border-radius: 100%;
  }
</style>
