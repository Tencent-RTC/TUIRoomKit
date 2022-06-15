<template>
  <li class="screen-window-previewer">
    <canvas
      ref="canvasRef"
      class="previewer-canvas"
      :width="data.thumbBGRA.width"
      :height="data.thumbBGRA.height"
      :data-id="data.sourceId"
    >
    </canvas>
    <div class="previewer-name">{{ data.sourceName }}</div>
  </li>
</template>
<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import { TRTCScreenCaptureSourceInfo } from '../../../tui-room-core';

interface Props {
  data: TRTCScreenCaptureSourceInfo;
}

// eslint-disable-next-line
const { data } = defineProps<Props>();

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null);

onMounted(() => {
  if (canvasRef.value) {
    if (data.thumbBGRA?.width && data.thumbBGRA?.height && data.thumbBGRA?.buffer) {
      const ctx: CanvasRenderingContext2D | null = canvasRef.value.getContext('2d');
      if (ctx !== null) {
        const img: ImageData = new ImageData(
          new Uint8ClampedArray(data.thumbBGRA.buffer as any),
          data.thumbBGRA.width,
          data.thumbBGRA.height,
        );
        ctx.putImageData(img, 0, 0);
      }
    }
  }
});
</script>

<style scoped lang="scss">
@import '../../../assets/style/var.scss';

.screen-window-previewer {
  list-style: none;
  display: inline-block;
  margin: 8px;
  padding: 8px;
  width: 160px;
  height: 122px;
  border: 1px solid $primaryColor;
  border-radius: 8px;
  text-align: center;
  &:hover {
    border-color: $activeStateColor;
    box-shadow: 2px 2px 10px 2px $activeStateColor;
  }
}

.previewer-canvas {
  width: 100%;
  height: 90px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.previewer-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
