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
	<image :src="svgUrl" :style="customStyle" @click="handleClick"></image>
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
}


const props = defineProps<Props>();
const emit = defineEmits(['click']);
const instance = getCurrentInstance();
const currentColor = ref();
const svgUrl = ref();

const customStyle: Ref<{
  backgroundImage?: string,
  width?: string,
  height?: string,
}> = ref({
  width: '48rpx',
  height: '48rpx',
});

const path = plus.io.convertLocalFileSystemURL(props.icon);
const regex = /.{3}$/;
// 从 svg 文件里读取宽高参数
plus.io.resolveLocalFileSystemURL(
  path,
  (entry) => {
    // 读取文件内容
    entry.file(
      (file) => {
        const fileReader = new plus.io.FileReader();
        fileReader.onloadend = function (e) {
          const res = e.target.result;
          let width;
          let height;
          if (/width="([0-9]+)"/.test(res)) {
            [, width] = res.match(/width="([0-9]+)"/);
          }
          if (/height="([0-9]+)"/.test(res)) {
            [, height] = res.match(/height="([0-9]+)"/);
          }
          if (width && height && !props.size) {
            customStyle.value.width = addSuffix(width);
            customStyle.value.height = addSuffix(height);
          }
          if (path.match(regex)[0] === 'svg') {
          svgUrl.value = `data:image/svg+xml,${encodeURIComponent(res)}`
          } else {
            svgUrl.value = props.icon;
          }
        };
        fileReader.readAsText(file);
      },
    );
  },
);

watch(() => props.size, (val) => {
  if (val) {
    customStyle.value.width = addSuffix(val);
    customStyle.value.height = addSuffix(val);
  }
});

onMounted(() => {
  watch(defaultTheme, async () => {
    await nextTick();
    const query = uni.createSelectorQuery().in(instance);
    query.select('.svg-icon').fields({ computedStyle: ['color'] })
      .exec((res) => {
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
