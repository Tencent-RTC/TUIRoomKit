<template>
  <ToolbarButtonMobile
    :label="t('AITools.Entry')"
    :active="active"
    :pressed="active"
    @click="emit('click')"
  >
    <IconCaptionMobile :size="20" />
  </ToolbarButtonMobile>
</template>

<script setup lang="ts">
import { IconCaptionMobile, t } from '../../../base';
import ToolbarButtonMobile from '../../../layouts/ToolbarButtonMobile/ToolbarButtonMobile.vue';

defineProps<{
  active?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>
