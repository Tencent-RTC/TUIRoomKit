<template>
  <div
    ref="rootRef"
    class="rk-root"
    :class="{ 'rk-root-cover': cover }"
    :style="{ background: cover ? 'transparent' : undefined }"
    :data-rk-theme="currentTheme"
  >
    <div class="rk-root-slot">
      <slot />
    </div>
    <div class="rk-overlay-root">
      <div ref="hostRef" class="rk-overlay-stack" />
      <div class="rk-overlay-toast">
        <ToastViewport />
      </div>
      <MessageBoxHost />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { provideIcons } from '../../icons/context';
import { removeOverlayContext, setActiveOverlayContext } from '../../overlayRegistry';
import { LANE_BASE, OVERLAY_CONTEXT_KEY } from '../../tokens';
import { useUIConfig } from '../../uiConfig';
import type { ThemeName } from '../../uiConfig';
import MessageBoxHost from '../MessageBox/MessageBoxHost.vue';
import { disposeMessageBoxStore } from '../MessageBox/store';
import { disposeToastStore } from '../Toast/store';
import ToastViewport from '../Toast/ToastViewport.vue';
import type { OverlayAcquireOptions, OverlayContext, OverlayHandle, OverlayLane } from '../../tokens';

defineOptions({ name: 'RoomKitProvider' });

const { uiConfig, setUIConfig } = useUIConfig();

const props = withDefaults(defineProps<{
  baseZ?: number;
  theme?: ThemeName;
  /** Register this host for command TUIToast / TUIMessageBox. */
  command?: boolean;
  /** Transparent cover used by appendTo. */
  cover?: boolean;
}>(), {
  baseZ: 0,
  theme: undefined,
  command: true,
  cover: false,
});

const emit = defineEmits<{
  'update:theme': [theme: ThemeName];
}>();

type OverlayLayer = {
  lane: OverlayLane;
  zIndex: number;
  closeOnEsc: boolean;
  onClose?: () => void;
};

const rootRef = ref<HTMLElement | null>(null);
const hostRef = ref<HTMLElement | null>(null);
let seed = 0;
const layers = new Map<number, OverlayLayer>();
const laneSeq: Record<OverlayLane, number> = {
  dropdown: 0,
  popover: 0,
  tooltip: 0,
  dialog: 0,
  toast: 0,
};

const topZ = () => {
  let max = 0;
  layers.forEach((layer) => {
    max = Math.max(max, layer.zIndex);
  });
  return max;
};

const acquire = (lane: OverlayLane, options: OverlayAcquireOptions = {}): OverlayHandle => {
  laneSeq[lane] += 1;
  let zIndex = props.baseZ + LANE_BASE[lane] + laneSeq[lane];
  const currentTop = topZ();
  if (currentTop >= zIndex) {
    zIndex = currentTop + 1;
  }
  seed += 1;
  const id = seed;
  layers.set(id, {
    lane,
    zIndex,
    closeOnEsc: options.closeOnEsc !== false,
    onClose: options.onClose,
  });
  return { id, zIndex };
};

const closeTopByEsc = () => {
  const closable = [...layers.values()].filter(layer => layer.closeOnEsc);
  if (closable.length === 0) {
    return false;
  }
  const top = closable.reduce((best, layer) => (
    layer.zIndex > best.zIndex ? layer : best
  ));
  top.onClose?.();
  return true;
};

const onEsc = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || event.defaultPrevented) {
    return;
  }
  if (!closeTopByEsc()) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
};

const release = (id: number) => {
  layers.delete(id);
};

const context: OverlayContext = {
  root: computed(() => rootRef.value),
  host: computed(() => hostRef.value),
  acquire,
  release,
};

const currentTheme = computed(() => uiConfig.theme);

watch(() => props.theme, (theme) => {
  if (theme !== undefined) {
    setUIConfig({ theme });
  }
}, { immediate: true });

watch(() => uiConfig.theme, (theme) => {
  emit('update:theme', theme);
}, { immediate: true });

provide(OVERLAY_CONTEXT_KEY, context);
provideIcons(computed(() => uiConfig.icons));

if (props.command) {
  setActiveOverlayContext(context);
}

defineExpose({ context });

onMounted(() => {
  document.addEventListener('keydown', onEsc, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onEsc, true);
  disposeToastStore(context);
  disposeMessageBoxStore(context);
  if (props.command) {
    removeOverlayContext(context);
  }
});
</script>

<style lang="scss">
@use '../../theme/index';

.rk-root,
.rk-root * {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}
</style>
