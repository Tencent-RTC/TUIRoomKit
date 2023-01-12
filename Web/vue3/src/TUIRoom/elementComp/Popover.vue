<template>
  <el-popover>
    <template #reference>
      <slot name="reference" />
    </template>
    <template #default>
      <slot name="default" />
    </template>
  </el-popover>
</template>

<script setup lang="ts">

</script>

<style>
@import '../assets/style/element-custom.scss';
</style>
