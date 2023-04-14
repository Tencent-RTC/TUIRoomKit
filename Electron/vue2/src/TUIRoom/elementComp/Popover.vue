<template>
  <el-popover
    :visible="visible"
    :popper-class="popperClass"
    :placement="placement"
    :width="width"
    :visible-arrow="showArrow">
    <template #reference>
      <slot name="reference" />
    </template>
    <template #default>
      <slot name="default" />
    </template>
  </el-popover>
</template>

<script setup lang="ts">


interface Props {
  visible?: boolean,
  popperClass?: string,
  placement?: string,
  width?: string | number,
  showArrow?: boolean,
}

const props = defineProps<Props>();

// element-ui Popover 的 visible 不用设置为 true，会引发状态不同步问题
// el-Popover 组件会默认监听 reference 的 click 事件

</script>

<style>
@import url('../assets/style/element-ui-custom.scss');
</style>