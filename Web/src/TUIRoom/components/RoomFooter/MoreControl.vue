<template>
  <div class="more-control-container">
    <icon-button
      title="更多"
      :icon-name="iconName"
    />
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/IconButton.vue';
const iconName = 'more';
</script>

<style lang="scss" scoped>

</style>
