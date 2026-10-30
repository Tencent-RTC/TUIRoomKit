<template>
  <ToolbarButtonPC
    :label="t('Settings.Title')"
    overflow-key="Settings.Title"
    :icon="IconSettings"
    :active="active"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { IconSettings, t } from '../../../base';
import ToolbarButtonPC from '../../../layouts/ToolbarButtonPC/ToolbarButtonPC.vue';

withDefaults(defineProps<{
  /** The dialog lives in the shell, so its open state arrives as a prop */
  active?: boolean;
}>(), {
  active: false,
});

defineEmits<{ click: [] }>();
</script>
