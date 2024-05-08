<!--
  * Name：SvgIcon
  * @param name String required
  * @param size String | number
  * Usage:
  * Use <svg-icon><chat-icon></chat-icon></svg-icon> in template
-->
<template>
  <span class="svg-icon" :class="customClass" :style="customStyle" @click="handleClick">
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance, nextTick } from 'vue';
import type { Ref } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { addSuffix } from '../../../utils/utils';

const basicStore = useBasicStore();

const { defaultTheme } = storeToRefs(basicStore);

interface Props {
  size?: string | number,
  responseSize?: string | number,
  customClass?: string,
  icon?: string,
  color?: string,
}

const props = defineProps<Props>();
const emit = defineEmits(['click']);
const instance = getCurrentInstance();
const currentColor = ref();

const customStyle: Ref<{
  backgroundImage?: string,
  width?: string,
  height?: string,
}> = ref({});

uni.getFileSystemManager().readFile({
  filePath: props.icon,
  encoding: 'binary',
  success: (res) => {
    let width;
    let height;
    if (/width="([0-9]+)"/.test(res.data)) {
      [, width] = res.data.match(/width="([0-9]+)"/);
    }
    if (/height="([0-9]+)"/.test(res.data)) {
      [, height] = res.data.match(/height="([0-9]+)"/);
    }
    if (width && height && !props.size) {
      customStyle.value.width = addSuffix(width);
      customStyle.value.height = addSuffix(height);
    }
  },
});

watch(() => props.size, (val) => {
  if (val) {
    customStyle.value.width = addSuffix(val);
    customStyle.value.height = addSuffix(val);
  }
});

watch(() => props.color, (val) => {
  if (val) {
    currentColor.value = val;
  }
}, { immediate: true });

onMounted(() => {
  watch(defaultTheme, async () => {
    await nextTick();
    const query = uni.createSelectorQuery().in(instance);
    query.select('.svg-icon').fields({ computedStyle: ['color'] }).exec((res) => {
      if (res[0] && res[0].color) {
        currentColor.value = res[0].color;
      }
    });
  }, { immediate: true });
});

const themeColorMap: Record<string, any> = {
  white: { baseColor: '#4F586B', activeColor: '#1C66E5' },
  black: { baseColor: '#D5E0F2', activeColor: '#4791FF' },
};

watch([defaultTheme, currentColor, () => props.icon], ([theme, currentColor]) => {
  const { baseColor, activeColor } = themeColorMap[theme];
  uni.getFileSystemManager().readFile({
    filePath: props.icon,
    encoding: 'binary',
    success: (res) => {
      const baseStr = res.data
        .replace(/currentColor/g, currentColor || baseColor)
        .replace(/var\(--active-color-2\)/g, activeColor);
      customStyle.value.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(baseStr)}");`;
    },
  });
}, { immediate: true });

function handleClick(event: Event) {
  emit('click', event);
}
</script>

<style lang="scss" scoped>
.svg-icon {
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
