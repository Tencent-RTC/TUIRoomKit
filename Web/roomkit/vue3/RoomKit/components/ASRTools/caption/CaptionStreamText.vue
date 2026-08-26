<template>
  <span class="cap-stream">
    <span
      v-for="word in words"
      :key="word.key"
      :class="{ 'cap-stream__word': word.nowrap }"
    >
      <template v-if="word.isPlain">{{ word.text }}</template>
      <template v-else>
        <span
          v-for="item in word.chars"
          :key="item.key"
          class="cap-stream__char"
          :class="{ 'cap-stream__char--enter': item.isEnter }"
        >{{ item.ch }}</span>
      </template>
    </span>
    <span
      v-if="showCaret && !isCompleted && text"
      class="cap-stream__caret"
      aria-hidden="true"
    />
  </span>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { STREAM_CHAR_REVEAL_MS } from '../constants';
import { buildCaptionWords, splitGraphemes } from '../utils/captionStream';

/** Matches the enter animation; settle by timer so wrap cannot replay it. */
const STREAM_CHAR_SETTLE_MS = 300;

const props = defineProps<{
  text: string;
  isCompleted?: boolean;
  /** Blinking caret for the live source line only. */
  showCaret?: boolean;
}>();

const revealedCount = ref(0);
const settledIndices = ref<Set<number>>(new Set());
let revealTimer: ReturnType<typeof setTimeout> | null = null;
const settleTimers = new Map<number, ReturnType<typeof setTimeout>>();

const graphemes = computed(() => splitGraphemes(props.text));

const clearRevealTimer = () => {
  if (revealTimer === null) {
    return;
  }
  clearTimeout(revealTimer);
  revealTimer = null;
};

const clearSettleTimers = () => {
  settleTimers.forEach((timer) => {
    clearTimeout(timer);
  });
  settleTimers.clear();
};

const markSettled = (index: number) => {
  settleTimers.delete(index);
  if (settledIndices.value.has(index)) {
    return;
  }
  const next = new Set(settledIndices.value);
  next.add(index);
  settledIndices.value = next;
};

const scheduleSettle = (index: number) => {
  if (settleTimers.has(index) || settledIndices.value.has(index)) {
    return;
  }
  settleTimers.set(index, setTimeout(() => {
    markSettled(index);
  }, STREAM_CHAR_SETTLE_MS));
};

/** Append-only typewriter. ASR tail rewrites must not rewind and replay. */
const scheduleReveal = (target: number) => {
  clearRevealTimer();
  if (revealedCount.value >= target) {
    return;
  }
  revealTimer = setTimeout(() => {
    const index = revealedCount.value;
    revealedCount.value += 1;
    scheduleSettle(index);
    scheduleReveal(target);
  }, STREAM_CHAR_REVEAL_MS);
};

watch(
  () => [graphemes.value.length, Boolean(props.isCompleted)] as const,
  ([length, isCompleted]) => {
    if (isCompleted) {
      revealedCount.value = length;
      settledIndices.value = new Set(Array.from({ length }, (_, index) => index));
      clearRevealTimer();
      clearSettleTimers();
      return;
    }
    if (length <= revealedCount.value) {
      revealedCount.value = length;
      clearRevealTimer();
      return;
    }
    scheduleReveal(length);
  },
  { immediate: true },
);

onUnmounted(() => {
  clearRevealTimer();
  clearSettleTimers();
});

const words = computed(() => buildCaptionWords({
  graphemes: graphemes.value,
  revealedCount: revealedCount.value,
  isCompleted: Boolean(props.isCompleted),
  settledIndices: settledIndices.value,
}));
</script>

<style scoped lang="scss">
.cap-stream {
  overflow-wrap: break-word;
  word-break: normal;
  line-break: auto;
  white-space: pre-wrap;
}

.cap-stream__word {
  display: inline;
  white-space: nowrap;
}

.cap-stream__char {
  display: inline;
}

.cap-stream__char--enter {
  animation: cap-stream-in 0.3s ease-out;
}

.cap-stream__caret {
  display: inline-block;
  width: 2px;
  height: 0.85em;
  margin-left: 2px;
  vertical-align: -0.08em;
  background: currentColor;
  pointer-events: none;
  animation: cap-stream-caret 1s step-end infinite;
}

@keyframes cap-stream-in {
  from {
    opacity: 0;
  }
}

@keyframes cap-stream-caret {
  50% {
    opacity: 0;
  }
}
</style>
