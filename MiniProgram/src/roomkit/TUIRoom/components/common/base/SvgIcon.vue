<!--
  * 名称：SvgIcon
  * @param name String required
  * @param size String | number
  * Usage:
  * Use <svg-icon><chat-icon></chat-icon></svg-icon> in template

  * 使用方式：
  * 在 template 中使用 <svg-icon><chat-icon></chat-icon></svg-icon>
-->
<template>
  <span
    class="svg-icon"
    :class="customClass"
    :style="customStyle"
    @click="handleClick"
  >
  </span>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  getCurrentInstance,
  nextTick,
  defineProps,
  defineEmits,
} from 'vue';
import type { Ref } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { addSuffix } from '../../../utils/utils';

const basicStore = useBasicStore();

const { defaultTheme } = storeToRefs(basicStore);

interface Props {
  size?: string | number;
  responseSize?: string | number;
  customClass?: string;
  icon?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['click']);
const instance = getCurrentInstance();
const currentColor = ref();

const customStyle: Ref<{
  backgroundImage?: string;
  backgroundSize?: string;
  width?: string;
  height?: string;
}> = ref({});

// 从 svg 文件里读取宽高参数
// eslint-disable-next-line no-undef
uni.getFileSystemManager().readFile({
  filePath: props.icon,
  encoding: 'binary',
  success: res => {
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

watch(
  () => props.size,
  val => {
    if (val) {
      customStyle.value.width = addSuffix(val);
      customStyle.value.height = addSuffix(val);
    }
  }
);

onMounted(() => {
  watch(
    defaultTheme,
    async () => {
      await nextTick();
      // eslint-disable-next-line no-undef
      const query = uni.createSelectorQuery().in(instance);
      query
        .select('.svg-icon')
        .fields({ computedStyle: ['color'] })
        .exec(res => {
          if (res[0] && res[0].color) {
            currentColor.value = res[0].color;
          }
        });
    },
    { immediate: true }
  );
});

const themeColorMap: Record<string, any> = {
  light: { baseColor: '#4F586B', activeColor: '#1C66E5' },
  dark: { baseColor: '#D5E0F2', activeColor: '#4791FF' },
};

watch(
  [defaultTheme, currentColor, () => props.icon],
  ([theme, currentColor]) => {
    const { baseColor, activeColor } = themeColorMap[theme];
    // 读取 svg 内容编码为 base64
    // eslint-disable-next-line no-undef
    uni.getFileSystemManager().readFile({
      filePath: props.icon,
      encoding: 'binary',
      success: res => {
        const baseStr = res.data
          .replace(/currentColor/g, currentColor || baseColor)
          .replace(/var\(--active-color-2\)/g, activeColor);
        // 将 svg 数据进行 URL 编码
        customStyle.value.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(baseStr)}");`;
        customStyle.value.backgroundSize = `100% 100%`;
      },
    });
  },
  { immediate: true }
);

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
