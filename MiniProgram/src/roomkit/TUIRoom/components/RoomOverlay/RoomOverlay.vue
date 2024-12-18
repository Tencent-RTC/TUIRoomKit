<template>
  <AISubtitlesOverlay v-if="overlayMap.AISubtitlesOverlay.visible" />
</template>

<script setup lang="ts">
import AISubtitlesOverlay from '../common/widgets/AITools/AISubtitles.vue';
import { useRoomOverlayHooks } from './useRoomOverlayHooks';

const { getOverlayMap } = useRoomOverlayHooks();
const overlayMap = getOverlayMap();
</script>

<style scoped lang="scss"></style>
