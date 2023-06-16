<!--
  * 名称：SvgIcon
  * @param name String required
  * @param size String 'large'|'medium'|'small'｜'custom'
  * Usage:
  * Use <svg-icon icon-name="star"/> in template

  * 使用方式：
  * 在 template 中使用 <svg-icon icon-name="star"/>
  * 如果要在外部设置大小，必须是传入custom
-->
<template>
  <div :class="svgClass" @click="handleClick"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  iconName: string,
  size?: string,
}

const props = defineProps<Props>();
const emit = defineEmits(['click']);
const svgName = computed((): string => `${props.iconName}`);
const svgClass = computed((): string => {
  const validate = props.size && ['large', 'medium', 'small', 'custom'].includes(props.size);
  const size = validate ? props.size : 'large';
  return `svg-icon ${size}-icon ${svgName.value}`;
});

function handleClick(event: Event) {
  emit('click', event);
}
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
