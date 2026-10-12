<template>
  <ToolbarButton
    :label="t('Settings.Title')"
    :icon="IconSettings"
    :active="active"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { IconSettings } from '../../../base';
import { t } from '../../../i18n';
import ToolbarButton from '../../../layouts/ToolbarButton.vue';

withDefaults(defineProps<{
  /** The dialog lives in the shell, so its open state arrives as a prop */
  active?: boolean;
}>(), {
  active: false,
});

defineEmits<{ click: [] }>();
</script>
