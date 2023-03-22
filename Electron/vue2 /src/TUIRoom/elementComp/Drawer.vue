<template>
  <el-drawer
    :visible.sync="visible"
    :title="props.title"
    :before-close="props.beforeClose"
    :modal="props.modal"
    :direction="props.direction"
    :size="props.size"
  >
    <slot></slot>
  </el-drawer>
</template>

<script setup lang="ts">

import { ref, Ref, computed, watch } from 'vue';

interface Props {
  modelValue: boolean,
  title?: string,
  beforeClose?: Function,
  modal?: boolean,
  appendToBody?: boolean,
  width?: string,
  direction?: string,
  size?: number | string,
  customClass?: string,
}

const props = defineProps<Props>();

const visible: Ref<boolean> = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

</script>

<style>
@import url('../assets/style/element-ui-custom.scss');

</style>
