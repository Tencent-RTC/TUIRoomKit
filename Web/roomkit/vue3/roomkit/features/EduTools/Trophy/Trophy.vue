<template>
  <Teleport v-if="fxHost" :to="fxHost">
    <div
      v-for="item in queue"
      :key="item.seq"
      class="trophy-fx"
      :class="{ 'is-idle': !landing(item.userId) }"
      :style="fxVars(item.userId)"
      aria-hidden="true"
    >
    <div class="trophy-fx-veil" />
    <div class="trophy-fx-burst">
      <span class="trophy-fx-glow" />
      <span class="trophy-fx-base" />
      <IconTrophyCup class="trophy-fx-cup" />
      <TrophyBanner :name="item.name" />
      <i
        v-for="(spark, index) in sparks"
        :key="`trophy-fx-spark-${index}`"
        class="trophy-fx-spark"
        :class="`is-${spark.kind}`"
        :style="sparkVars(spark, index)"
      />
      <svg
        v-for="(ribbon, index) in ribbons"
        :key="`trophy-fx-ribbon-${index}`"
        class="trophy-fx-ribbon"
        viewBox="0 0 48 16"
        :style="ribbonVars(ribbon)"
      >
        <path :d="ribbonShapes[index % ribbonShapes.length]" :fill="sparkColors[index % sparkColors.length]" />
        <path :d="ribbonSheens[index % ribbonSheens.length]" fill="#fff" opacity="0.42" />
      </svg>
      <i
        v-for="(dot, index) in sideDots"
        :key="`trophy-fx-dot-${index}`"
        class="trophy-fx-side-dot"
        :style="dotVars(dot, index)"
      />
    </div>
  </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { IconTrophyCup, OVERLAY_CONTEXT_KEY } from '../../../base';
import TrophyBanner from './TrophyBanner.vue';
import { useTrophyEventWatcher, useTrophyFxQueue } from './trophyActions';

/**
 * Full-screen trophy celebration, ported from the interaction design
 * (features/Participants/ClassRoster-edu). Mount once per scene: it brings
 * its own award-message watcher, and each queue entry plays out on its own for
 * ~3s so consecutive awards overlap instead of cutting each other.
 */

// The watcher feeds the queue, so mounting this component is the whole wiring.
useTrophyEventWatcher();

const queue = useTrophyFxQueue();

/* Scene content sits in `.rk-root-slot` (z-index 0), one layer below the
 * provider's overlay root (z-index 1) where dialogs teleport to, so any
 * z-index inside the scene loses to an open dialog. Teleport the fx into
 * the overlay host instead: it outranks dialog masks within that stacking
 * context, while the toast viewport above it stays on top. */
const overlayContext = inject(OVERLAY_CONTEXT_KEY, null);
const fxHost = computed(() => overlayContext?.host.value ?? null);

const sparkColors = ['#ff5d7a', '#3b82f6', '#7c4dff', '#22c3a6', '#ffb020', '#ff7a3d', '#5aa2ff', '#e85dff'];

interface SparkBit {
  kind: 'star' | 'square';
  angle: number;
  distance: number;
  turn: number;
  size: number;
}

const sparks: SparkBit[] = [
  ...Array.from({ length: 24 }, (_, index): SparkBit => ({
    kind: 'star',
    angle: 3.8 + (index / 23) * 1.8,
    distance: 65 + (index % 4) * 30 + (index % 2) * 10,
    turn: (index % 2 ? 1 : -1) * (15 + (index % 4) * 10),
    size: 10 + (index % 3) * 3,
  })),
  ...Array.from({ length: 12 }, (_, index): SparkBit => ({
    kind: 'square',
    angle: 4.0 + (index / 11) * 1.4,
    distance: 75 + (index % 3) * 30 + (index % 2) * 15,
    turn: (index % 2 ? 1 : -1) * (30 + (index % 3) * 15),
    size: 7 + (index % 2) * 2,
  })),
];

const ribbonShapes = [
  'M 4 6 Q 14 0 24 6 Q 34 12 44 6 L 44 12 Q 34 18 24 12 Q 14 6 4 12 Z',
  'M 4 10 Q 14 16 24 10 Q 34 4 44 10 L 44 4 Q 34 -2 24 4 Q 14 10 4 4 Z',
  'M 6 8 Q 15 2 24 8 Q 33 14 42 8 L 42 14 Q 33 20 24 14 Q 15 8 6 14 Z',
  'M 6 8 Q 15 14 24 8 Q 33 2 42 8 L 42 2 Q 33 -4 24 2 Q 15 8 6 2 Z',
];

const ribbonSheens = [
  'M 8 4.5 Q 14 1.5 20 4.5 L 20 7 Q 14 4 8 7 Z',
  'M 28 8.5 Q 34 5.5 40 8.5 L 40 11 Q 34 8 28 11 Z',
  'M 9 6.5 Q 15 3.5 21 6.5 L 21 9 Q 15 6 9 9 Z',
  'M 27 6.5 Q 33 3.5 39 6.5 L 39 9 Q 33 6 27 9 Z',
];

const ribbons = [
  { angle: 3.14, distance: 102, rot: -8, scale: 1.05 },
  { angle: 3.22, distance: 78, rot: -3, scale: 0.8 },
  { angle: 3.4, distance: 92, rot: 15, scale: 1.0 },
  { angle: 3.62, distance: 72, rot: 28, scale: 0.9 },
  { angle: 3.85, distance: 108, rot: 41, scale: 1.1 },
  { angle: 4.08, distance: 84, rot: 54, scale: 0.86 },
  { angle: 5.36, distance: 98, rot: -52, scale: 0.95 },
  { angle: 5.55, distance: 76, rot: -42, scale: 1.08 },
  { angle: 5.78, distance: 112, rot: -29, scale: 0.84 },
  { angle: 5.95, distance: 86, rot: -19, scale: 1.02 },
  { angle: 6.12, distance: 96, rot: -9, scale: 0.92 },
  { angle: 6.24, distance: 74, rot: -2, scale: 1.06 },
];

const sideDots = Array.from({ length: 20 }, (_, index) => {
  const sideIndex = index % 10;
  return {
    angle: index < 10 ? 3.14 + sideIndex * 0.1 : 5.38 + sideIndex * 0.095,
    distance: 100 + (sideIndex % 5) * 12 + (sideIndex % 2) * 6,
    size: 3 + (index % 3),
  };
});

function sparkVars(spark: SparkBit, index: number): Record<string, string> {
  return {
    '--sx': `${Math.cos(spark.angle) * spark.distance}px`,
    '--sy': `${Math.sin(spark.angle) * spark.distance}px`,
    '--turn': `${spark.turn}deg`,
    '--sz': `${spark.size}px`,
    '--c': sparkColors[index % sparkColors.length],
  };
}

function ribbonVars(ribbon: { angle: number; distance: number; rot: number; scale: number }): Record<string, string> {
  return {
    '--sx': `${Math.cos(ribbon.angle) * ribbon.distance}px`,
    '--sy': `${Math.sin(ribbon.angle) * ribbon.distance}px`,
    '--rot': `${ribbon.rot}deg`,
    '--sc': String(ribbon.scale),
  };
}

function dotVars(dot: { angle: number; distance: number; size: number }, index: number): Record<string, string> {
  return {
    '--sx': `${Math.cos(dot.angle) * dot.distance}px`,
    '--sy': `${Math.sin(dot.angle) * dot.distance}px`,
    '--sz': `${dot.size}px`,
    '--d': `${(index % 3) * 0.02}s`,
  };
}

/** Badge anchor on the awarded member's tile (ParticipantTileEduPC .edu-trophy):
 * top/right 4px inset, ~34x18 pill, so its center sits (21, 13) inside the corner. */
const LANDING_BADGE_OFFSET_X = 21;
const LANDING_BADGE_OFFSET_Y = 13;

/** The burst flies toward the awarded member's trophy badge when the awarded
 * member is on the scene's stage; nobody on stage means no flight at all. */
function landing(userId: string): { x: number; y: number } | null {
  const tile = document.querySelector<HTMLElement>(`[data-trophy-landing="${CSS.escape(userId)}"]`);
  if (!tile) {
    return null;
  }
  const rect = tile.getBoundingClientRect();
  return {
    x: rect.right - LANDING_BADGE_OFFSET_X - window.innerWidth / 2,
    y: rect.top + LANDING_BADGE_OFFSET_Y - window.innerHeight / 2,
  };
}

function fxVars(userId: string): Record<string, string> {
  const point = landing(userId);
  return point
    ? { '--fly-x': `${point.x}px`, '--fly-y': `${point.y}px` }
    : { '--fly-x': '0px', '--fly-y': '0px' };
}
</script>

<style scoped lang="scss" src="./Trophy.scss"></style>
