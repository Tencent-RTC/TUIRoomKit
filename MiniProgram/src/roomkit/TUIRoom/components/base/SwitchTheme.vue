<!--
  * Name: Switchtheme
  * Usage:
  * Use <switch-theme /> in template
  *
  * 名称: Switchtheme
  * 使用方式：
  * 在 template 中使用 <switch-theme />
-->
<template>
  <svg-icon
    class="switch-theme" icon-name="switch-theme" size="medium" @click="handleSwitchTheme"
  ></svg-icon>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);

function handleSwitchTheme() {
  const currentTheme = document?.body.getAttribute('data-theme') || defaultTheme;
  if (currentTheme === 'white') {
    basicStore.setDefaultTheme('black');
  } else if (currentTheme === 'black') {
    basicStore.setDefaultTheme('white');
  }
}

function doSwitchTheme(theme: string) {
  switch (theme) {
    case 'black':
      document?.body.setAttribute('data-theme', 'black');
      uni.setStorageSync('tuiRoom-currentTheme', 'black');
      break;
    case 'white':
      document?.body.setAttribute('data-theme', 'white');
      uni.setStorageSync('tuiRoom-currentTheme', 'white');
      break;
  };
}

watch(defaultTheme, (val: string) => {
  doSwitchTheme(val);
});

onMounted(() => {
  const defaults = basicStore.defaultTheme;
  const storageCurrentTheme = uni.getStorageSync('tuiRoom-currentTheme') || defaults;
  basicStore.setDefaultTheme(storageCurrentTheme);
  document?.body.setAttribute('data-theme', storageCurrentTheme);
});
</script>

<style>
.switch-theme {
  cursor: pointer;
}
</style>
