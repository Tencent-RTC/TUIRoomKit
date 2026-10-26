<template>
  <ToolbarButtonMobile :label="t('Settings.Title')" @click="$emit('click')">
    <IconSettings :size="20" />
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { IconSettings, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';

defineEmits<{ click: [] }>();
</script>
