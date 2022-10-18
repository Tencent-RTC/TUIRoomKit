<!--
  * 名称：SvgIcon
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * Usage:
  * Use <svg-icon icon-name="star"/> in template

  * 使用方式：
  * 在 template 中使用 <svg-icon icon-name="star"/>
-->
<template>
  <div :class="svgClass"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  iconName: string,
  size?: string,
}

const props = defineProps<Props>();
const svgName = computed((): string => `${props.iconName}`);
const svgClass = computed((): string => {
  const validate = props.size && ['large', 'medium', 'small'].includes(props.size);
  const size = validate ? props.size : 'large';
  return `svg-icon ${size}-icon ${svgName.value}`;
});
</script>

<style lang="scss" scoped>
@import url(../../assets/style/svg.scss);

.svg-icon {
  overflow: hidden;
  display: inline-block;
  background-size: contain;
}
.small-icon {
  width: 12px;
  height: 12px;
}
.medium-icon {
  width: 20px;
  height: 20px;
}
.large-icon {
  width: 32px;
  height: 32px;
}
</style>
