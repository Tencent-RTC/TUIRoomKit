<template>
  <svg-icon-file
    v-if="isSvgIconFile"
    :icon="icon"
    :size="size"
    :customClass="customClass"
  ></svg-icon-file>
  <svg-icon-font
    v-if="!isSvgIconFile"
    :icon="icon"
    :size="size"
    :customStyle="customStyle"
    :color="color"
  ></svg-icon-font>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SvgIconFile from './SvgIconFile.vue';
import SvgIconFont from './SvgIconFont.vue';

interface Props {
  size?: string | number,
  responseSize?: string | number,
  customClass?: string,
  customStyle?: Object,
  icon?: string,
  color?: string,
}
const props = defineProps<Props>();

const isSvgIconFile = computed(() => props.icon && props.icon.slice(-4) === '.svg');

</script>

<style>
</style>
