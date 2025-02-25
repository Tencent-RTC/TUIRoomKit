<template></template>
<script setup lang="ts">
import { onMounted } from 'vue';
declare const uni: any;
onMounted(() => {
  uni.showToast({
    icon: 'loading',
  });
  uni.redirectTo({ url: '/roomkit/pages/home' });
});
</script>
