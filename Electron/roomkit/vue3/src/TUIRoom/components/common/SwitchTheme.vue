<!--
  * Name: Switchtheme
  * Usage:
  * Use <switch-theme /> in template
  *
-->
<template>
  <icon-button
    v-if="visible && switchThemeConfig.visible"
    :title="t('Switch Theme')"
    :layout="IconButtonLayout.HORIZONTAL"
    :icon="SwitchThemeIcon"
    @click-icon="handleSwitchTheme"
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
import { useI18n } from '../../locales';
import { roomService } from '../../services';
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);
const { t } = useI18n();
const switchThemeConfig = roomService.getComponentConfig('SwitchTheme');

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
