<template>
  <StreamRegion
    v-if="streamInfo"
    :stream-info="streamInfo"
    :fill-mode="fillMode"
    :support-touch-scale="supportTouchScale"
    :stream-play-quality="StreamPlayQuality.HIGH"
    :aspect-ratio="aspectRatio"
    @stream-view-dblclick="$emit('stream-view-dblclick')"
  />
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from 'vue';
import StreamRegion from '../common/StreamRegion/index.vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-electron';
import { isPC } from '../../../utils/environment';
import { StreamPlayQuality } from '../../../services/manager/mediaManager';

interface Props {
  streamInfo?: { userId: string; streamType: TUIVideoStreamType };
  fillMode?: 'fill' | 'contain';
  supportTouchScale?: boolean;
}
defineProps<Props>();

defineEmits(['stream-view-dblclick']);

const aspectRatio = ref(isPC ? '16:9' : 'auto');
</script>

<style lang="scss" scoped></style>
