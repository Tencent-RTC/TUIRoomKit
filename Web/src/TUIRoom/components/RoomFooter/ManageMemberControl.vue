<template>
  <div class="invite-control-container">
    <icon-button
      title="管理成员"
      :icon-name="iconName"
    />
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/IconButton.vue';
const iconName = 'manage-member';
</script>

<style lang="scss" scoped>

</style>
