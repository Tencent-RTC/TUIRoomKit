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
    class="switch-theme" icon-name="switch-theme" size="medium" @click="switchTheme"
  ></svg-icon>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import { useBasicStore } from '../../stores/basic';
const basicStore = useBasicStore();

function switchTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || '';
  switch (currentTheme) {
    case 'white':
      document.body.setAttribute('data-theme', 'black');
      localStorage.setItem('tuiRoom-currentTheme', 'black');
      basicStore.setDefaultTheme('black');
      break;
    case 'black':
      document.body.setAttribute('data-theme', 'white');
      localStorage.setItem('tuiRoom-currentTheme', 'white');
      basicStore.setDefaultTheme('white');
      break;
  };
}

onMounted(() => {
  const defaults = basicStore.defaultTheme;
  const storageCurrentTheme = localStorage.getItem('tuiRoom-currentTheme') || defaults;
  basicStore.setDefaultTheme(storageCurrentTheme);
  document.body.setAttribute('data-theme', storageCurrentTheme);
});
</script>

<style>
.switch-theme {
  cursor: pointer;
}
</style>
