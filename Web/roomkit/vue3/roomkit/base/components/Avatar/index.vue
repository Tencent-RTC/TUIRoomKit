<template>
  <span
    class="rk-avatar"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.round(size * 0.4)}px`,
    }"
    :aria-label="alt || undefined"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="alt"
      @error="onError"
    >
    <span v-else>{{ initial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

defineOptions({ name: 'TUIAvatar' });

const props = withDefaults(defineProps<{
  src?: string;
  alt?: string;
  size?: number;
}>(), {
  src: '',
  alt: '',
  size: 32,
});

const failed = ref(false);

watch(() => props.src, () => {
  failed.value = false;
});

const imageSrc = computed(() => (!failed.value && props.src ? props.src : ''));
const initial = computed(() => props.alt.trim().slice(0, 1).toUpperCase());

function onError() {
  failed.value = true;
}
</script>

<style scoped lang="scss">
.rk-avatar {
  overflow: hidden;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: var(--rk-avatar-fg);
  background: var(--rk-avatar-bg);
  font-weight: 600;
  line-height: 1;
}

.rk-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
