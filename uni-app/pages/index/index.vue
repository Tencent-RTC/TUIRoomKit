<template>
  <div></div>
</template>
<script setup lang="ts">
import router from '../../src/router';
import { onMounted } from 'vue';

onMounted(() => {
  router.replace({ path: '/src/roomkit/pages/home' });
  uni.showToast({
    icon: 'loading',
  });
});
</script>
