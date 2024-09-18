<template>
  <li class="screen-window-previewer">
    <canvas
      ref="canvasRef"
      :class="[data.isMinimizeWindow ? 'previewer-mini' : 'previewer-canvas']"
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
    if (
      data.thumbBGRA?.width &&
      data.thumbBGRA?.height &&
      data.thumbBGRA?.buffer
    ) {
      const ctx: CanvasRenderingContext2D | null =
        canvasRef.value.getContext('2d');
      if (ctx !== null) {
        const img: ImageData = new ImageData(
          new Uint8ClampedArray(data.thumbBGRA.buffer as any),
          data.thumbBGRA.width,
          data.thumbBGRA.height
        );
        ctx.putImageData(img, 0, 0);
      }
    }
  }
});
</script>

<style scoped lang="scss">
.screen-window-previewer {
  display: inline-block;
  width: 184px;
  margin-right: 40px;
  margin-bottom: 40px;
  text-align: center;
  list-style: none;
  border: 2px solid #e4eaf7;
  border-radius: 8px;

  &:hover {
    border-color: #1c66e5;
  }
}

.previewer-canvas,
.previewer-mini {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 8px;
}

.previewer-mini {
  width: 110px;
  height: 110px;
  padding: 4px;
}

.previewer-name {
  padding: 0 20px;
  overflow: hidden;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
