<template>
  <div
    ref="rootRef"
    class="rk-root"
    :class="[{ 'rk-root-cover': cover, 'is-h5': !isPC }, `rk-scene-${sceneClass}`]"
    :style="rootStyle"
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
import { getPlatform } from '@tencentcloud/universal-api';
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { provideIcons } from '../../icons/context';
import { activeScene, removeOverlayContext, setActiveOverlayContext, setActiveScene } from '../../overlayRegistry';
import { LANE_BASE, OVERLAY_CONTEXT_KEY } from '../../tokens';
import { useUIConfig } from '../../uiConfig';
import type { ThemeName } from '../../uiConfig';
import MessageBoxHost from '../MessageBox/MessageBoxHost.vue';
import { disposeMessageBoxStore } from '../MessageBox/store';
import { disposeToastStore } from '../Toast/store';
import ToastViewport from '../Toast/ToastViewport.vue';
import type { OverlayAcquireOptions, OverlayContext, OverlayHandle, OverlayLane } from '../../tokens';

defineOptions({ name: 'RoomKitProvider' });

const isPC = getPlatform() === 'pc';

const { uiConfig, setUIConfig } = useUIConfig();

const props = withDefaults(defineProps<{
  baseZ?: number;
  theme?: ThemeName;
  /** Appended to the root as an `rk-scene-*` class; defaults to `conference`, `education` renders the edu token pack. `'auto'` (append hosts) mirrors the most recently mounted explicit scene. */
  scene?: string;
  /** Register this host for command TUIToast / TUIMessageBox. */
  command?: boolean;
  /** Transparent cover used by appendTo. */
  cover?: boolean;
}>(), {
  baseZ: 0,
  theme: undefined,
  scene: 'conference',
  command: true,
  cover: false,
});

const emit = defineEmits<{
  'update:theme': [theme: ThemeName];
}>();

/** 'auto' (append hosts) mirrors the most recently mounted explicit scene,
 * so body-level notices keep the active scene's brand tokens. */
const sceneClass = computed(() => (props.scene === 'auto' ? activeScene.value : props.scene));

// Explicit scenes register themselves so append hosts can mirror them.
watch(() => props.scene, (scene) => {
  if (scene !== 'auto') {
    setActiveScene(scene);
  }
}, { immediate: true });

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

// Inline custom properties outrank the [data-rk-theme] token blocks, so only the active theme's colors go inline.
const rootStyle = computed(() => {
  const colors = uiConfig.colors[uiConfig.theme];
  return {
    'background': props.cover ? 'transparent' : undefined,
    '--rk-brand': colors?.primaryColor,
    '--rk-bg-page': colors?.backgroundColor,
    '--rk-text-primary': colors?.textColor,
    '--rk-font': uiConfig.fontFamily,
  };
});

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
