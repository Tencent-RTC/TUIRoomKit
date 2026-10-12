<template>
  <div class="rk-watermark">
    <slot />
    <div class="rk-watermark-layer" :style="layerStyle" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useUIConfig } from '../../uiConfig';
import { createWatermarkPattern } from './useCanvasPattern';
import type { WatermarkFont } from './useCanvasPattern';

defineOptions({ name: 'TUIWatermark' });

const { uiConfig } = useUIConfig();

const props = withDefaults(defineProps<{
  content?: string | string[];
  image?: string;
  rotate?: number;
  gap?: [number, number];
  font?: WatermarkFont;
}>(), {
  rotate: -22,
  gap: () => [120, 80],
});

const pattern = ref('');
let renderToken = 0;

const fallbackColor = computed(() => (
  uiConfig.theme === 'dark' ? 'color-mix(in srgb, white 12%, transparent)' : 'color-mix(in srgb, var(--rk-text-tertiary) 28%, transparent)'
));

const layerStyle = computed<CSSProperties>(() => ({
  backgroundImage: pattern.value ? `url(${pattern.value})` : undefined,
}));

async function render() {
  renderToken += 1;
  const current = renderToken;
  const base = {
    content: props.content,
    rotate: props.rotate,
    gap: props.gap,
    font: props.font,
    fallbackColor: fallbackColor.value,
  };
  try {
    const next = await createWatermarkPattern({ ...base, image: props.image });
    if (current !== renderToken) {
      return;
    }
    pattern.value = next;
  } catch (error) {
    console.warn('[RoomKit] Watermark image failed, falling back to text.', error);
    try {
      const next = await createWatermarkPattern(base);
      if (current !== renderToken) {
        return;
      }
      pattern.value = next;
    } catch {
      if (current !== renderToken) {
        return;
      }
      pattern.value = '';
    }
  }
}

onMounted(render);
watch(() => [props.content, props.image, props.rotate, props.gap, props.font, fallbackColor.value], render);
</script>

<style scoped lang="scss">
.rk-watermark {
  position: relative;
  width: 100%;
  height: 100%;
}

.rk-watermark-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-repeat: repeat;
}
</style>
