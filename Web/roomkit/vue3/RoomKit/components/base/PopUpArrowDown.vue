<template>
  <div class="popup-arrow-down">
    <IconArrowDown />
  </div>
</template>

<script setup lang="ts">
import { IconArrowDown } from '@tencentcloud/uikit-base-component-vue3';

</script>

<style lang="scss" scoped>
.popup-arrow-down {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 26px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;
}
</style>
