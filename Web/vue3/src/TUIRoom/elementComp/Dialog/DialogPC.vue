<template>
  <el-dialog class="custom-element-class">
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

</script>

<style>
@import '../../assets/style/element-custom.scss';

</style>
