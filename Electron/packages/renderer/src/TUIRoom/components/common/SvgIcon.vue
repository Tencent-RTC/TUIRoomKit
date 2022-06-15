<!--
  * 名称：SvgIcon
  * @param name String required
  * @param size String 'large'|'medium'|'small'
  * 依赖：src/assets/icons/index.js 需要在 vite 中配置
  * 使用方式：
  * 在 template 中使用 <svg-icon icon-name="star"/>
-->
<template>
  <svg :class="svgClass" aria-hidden="true" v-on="$attrs">
    <use :xlink:href="svgName" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  iconName: string,
  size?: string,
}

const props = defineProps<Props>();
const svgName = computed((): string => `#icon-${props.iconName}`);
const svgClass = computed((): string => {
  const validate = props.size && ['large', 'medium', 'small'].includes(props.size);
  const size = validate ? props.size : 'large';
  return `svg-icon ${size}-icon`;
});
</script>

<style scoped>
.svg-icon {
  fill: currentColor;
  overflow: hidden;
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
