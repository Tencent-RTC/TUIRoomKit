<template>
  <li class="screen-window-previewer">
    <canvas
      ref="canvasRef"
      :class="[data.isMinimizeWindow ? 'previewer-mini':'previewer-canvas']"
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
import { TRTCScreenCaptureSourceInfo } from '@tencentcloud/tuiroom-engine-electron';

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
.screen-window-previewer {
  list-style: none;
  display: inline-block;
  margin-right: 40px;
  width: 184px;
  border-radius: 8px;
  border: 2px solid #e4eaf7;
  text-align: center;
  margin-bottom: 40px;
  &:hover {
    border-color: #1c66e5;
  }
}

.previewer-canvas,
.previewer-mini {
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
}
.previewer-mini {
  width: 110px;
  height: 110px;
  padding: 4px;
}

.previewer-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  padding: 0 20px;
}
</style>

