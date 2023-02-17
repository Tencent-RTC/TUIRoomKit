<template>
  <el-popover
    v-model="showPopover"
    :popper-class="popperClass"
    :placement="placement"
    :width="width"
    :visible-arrow="showArrow"
    :teleported="teleported">
    <template #reference>
      <slot name="reference" />
    </template>
    <template #default>
      <slot name="default" />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, Ref, watch } from 'vue';


interface Props {
  visible: boolean,
  popperClass?: string,
  placement?: string,
  width?: string | number,
  showArrow?: boolean,
  teleported?: boolean,
}

const props = defineProps<Props>();

const showPopover: Ref<boolean> = ref(props.visible);
watch(() => props.visible, (val) => {
  showPopover.value = val;
})

</script>

<style>
@import url('../assets/style/element-ui-custom.scss');

</style>
