<template>
  <el-dialog
    :visible.sync="props.modelValue"
    :title="props.title"
    :before-close="props.beforeClose"
    :modal="props.modal"
    :append-to-body="props.appendToBody"
    :width="props.width"
    :show-close="props.showClose"
    :close-on-click-modal="props.closeOnClickModal"
    :close-on-press-escape="props.closeOnPressEscape"
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
  showClose?: boolean,
  closeOnClickModal?: boolean,
  closeOnPressEscape?: boolean,
}

const props = defineProps<Props>();

</script>

<style>
@import url('../assets/style/element-ui-custom.scss');

</style>
