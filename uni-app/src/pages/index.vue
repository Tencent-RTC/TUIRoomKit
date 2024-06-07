<template>
</template>
<script setup lang="ts">
import router from '@/router';
import { onMounted } from 'vue';

onMounted(() => {
  router.replace({ path: '/roomkit/pages/home' });
  uni.showToast({
    icon: 'loading',
  });
});
</script>
