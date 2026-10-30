<template>
  <span class="trophy-fx-label">
    <svg viewBox="0 0 300 100">
      <defs>
        <linearGradient :id="`trophy-fx-grad-${uid}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd54f" />
          <stop offset="100%" stop-color="#f7b722" />
        </linearGradient>
        <path :id="`trophy-fx-path-${uid}`" d="M 40 52 Q 150 82 260 52" />
      </defs>
      <path class="trophy-fx-banner-tail" d="M 40 30 L 0 15 L 15 30 L 0 45 L 30 50 Z" />
      <path class="trophy-fx-banner-tail" d="M 260 30 L 300 15 L 285 30 L 300 45 L 270 50 Z" />
      <path class="trophy-fx-banner-fold" d="M 40 30 L 30 50 L 40 66 Z" />
      <path class="trophy-fx-banner-fold" d="M 260 30 L 270 50 L 260 66 Z" />
      <path :fill="`url(#trophy-fx-grad-${uid})`" d="M 40 30 Q 150 60 260 30 L 260 66 Q 150 96 40 66 Z" />
      <path class="trophy-fx-banner-shade" d="M 40 62 Q 150 92 260 62 L 260 66 Q 150 96 40 66 Z" />
      <text>
        <textPath :href="`#trophy-fx-path-${uid}`" startOffset="50%" text-anchor="middle">
          <tspan class="trophy-fx-banner-lead">{{ t('Education.Roster.TrophyCongrats') }}</tspan>
          <tspan class="trophy-fx-banner-name">{{ name }}</tspan>
          <tspan class="trophy-fx-banner-lead">{{ t('Education.Roster.TrophyReceived') }}</tspan>
        </textPath>
      </text>
    </svg>
    <em class="trophy-fx-screen-reader">
      {{ t('Education.Roster.TrophyCongrats') }} {{ name }} {{ t('Education.Roster.TrophyReceived') }}
    </em>
  </span>
</template>

<script lang="ts">
// Module scope: one counter shared by every banner instance.
let bannerUid = 0;
</script>

<script setup lang="ts">
import { t } from '../../../base';

/**
 * Ribbon banner of the trophy celebration. The recipient's name is set at
 * runtime on a curved textPath, so this cannot be a static icon: each
 * instance carries its own defs, namespaced by a per-instance uid so
 * overlapping celebrations never resolve each other's references.
 */

defineProps<{
  name: string;
}>();

const uid = ++bannerUid;
</script>

<style scoped lang="scss" src="./TrophyBanner.scss"></style>
