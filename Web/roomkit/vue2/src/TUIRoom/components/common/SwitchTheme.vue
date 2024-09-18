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
  />
</template>

<script setup lang="ts">
import { withDefaults, defineProps } from 'vue';
import IconButton from './base/IconButton.vue';
import SwitchThemeIcon from './icons/SwitchThemeIcon.vue';
import { IconButtonLayout } from '../../constants/room';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { roomService } from '../../services';
const basicStore = useBasicStore();
const { t } = useI18n();
const switchThemeConfig = roomService.getComponentConfig('SwitchTheme');

interface Props {
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: true,
});

function handleSwitchTheme() {
  roomService.setTheme(basicStore.defaultTheme === 'white' ? 'black' : 'white');
}
</script>

<style></style>
