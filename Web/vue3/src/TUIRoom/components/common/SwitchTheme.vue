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
  <icon-button
    v-if="visible"
    :title="t('Switch Theme')"
    :layout="IconButtonLayout.HORIZONTAL"
    :icon="SwitchThemeIcon"
    @click="handleSwitchTheme"
  >
  </icon-button>
</template>

<script setup lang="ts">
import IconButton from './base/IconButton.vue';
import SwitchThemeIcon from './icons/SwitchThemeIcon.vue';
import { IconButtonLayout } from '../../constants/room';
import { watch } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);
const { t } = useI18n();

interface Props {
  visible?: boolean,
}

withDefaults(defineProps<Props>(), {
  visible: true,
});

function handleSwitchTheme() {
  if (defaultTheme.value === 'white') {
    basicStore.setDefaultTheme('black');
  } else if (defaultTheme.value === 'black') {
    basicStore.setDefaultTheme('white');
  }
}

function doSwitchTheme(theme: string) {
  switch (theme) {
    case 'black':
      document.body.classList.remove('tui-theme-white');
      document.body.classList.add('tui-theme-black');
      localStorage.setItem('tuiRoom-currentTheme', 'black');
      break;
    case 'white':
      document.body.classList.remove('tui-theme-black');
      document.body.classList.add('tui-theme-white');
      localStorage.setItem('tuiRoom-currentTheme', 'white');
      break;
  };
}

const storageCurrentTheme = localStorage.getItem('tuiRoom-currentTheme');
if (storageCurrentTheme) {
  basicStore.setDefaultTheme(storageCurrentTheme);
}

watch(defaultTheme, (val: string) => {
  doSwitchTheme(val);
}, { immediate: true });

</script>

<style>
</style>
