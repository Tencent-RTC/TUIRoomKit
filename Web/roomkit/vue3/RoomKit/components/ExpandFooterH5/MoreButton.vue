<template>
  <IconButtonH5
    class="more-button-h5"
    :title="t('RoomMore.Title')"
    @click="handleToggleMoreMenu"
  >
    <span :class="{ 'icon-rotate': showMoreMenu, 'icon-container': true }">
      <IconExpand :size="24" />
    </span>
  </IconButtonH5>
</template>

<script setup lang="ts">
import { IconExpand, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import IconButtonH5 from '../base/IconButtonH5.vue';

const { t } = useUIKit();

const props = defineProps<{
  showMoreMenu: boolean;
}>();

const emit = defineEmits(['toggle-more-menu']);

function handleToggleMoreMenu() {
  emit('toggle-more-menu', !props.showMoreMenu);
}
</script>

<style lang="scss" scoped>
.more-button-h5 {
  width: 33px;
  height: 52px;
}

.icon-container {
  display: inline-flex;
  transition: transform 0.3s ease;
}

.icon-rotate {
  transform: rotate(180deg);
}
</style>
