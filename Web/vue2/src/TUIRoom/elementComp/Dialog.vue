<template>
  <el-dialog
    :visible.sync="props.modelValue"
    :title="props.title"
    :before-close="props.beforeClose"
    :modal="props.modal"
    :append-to-body="props.appendToBody"
    :width="props.width"
  >
    <slot></slot>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

interface Props {
  modelValue: boolean,
  title?: string,
  beforeClose?: Function,
  modal?: boolean,
  appendToBody?: boolean,
  width?: string,
}

const props = defineProps<Props>();

</script>

<style>
@import url('../assets/style/element-ui-custom.scss');

</style>
