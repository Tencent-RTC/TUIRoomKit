<template>
  <div class="virtual-background-settings" role="tabpanel">
    <div class="virtual-background-grid">
      <button
        v-for="option in options"
        :key="option.id"
        class="virtual-background-item"
        :class="{
          'is-active': option.id === selectedId,
          'is-soft': option.kind !== 'image',
          'is-blur': option.kind === 'blur',
        }"
        type="button"
        :disabled="!isReady"
        :title="labelFor(option)"
        :aria-pressed="option.id === selectedId"
        @click="select(option.id)"
      >
        <span
          class="virtual-background-face"
          :style="option.thumbnail ? { backgroundImage: option.thumbnail } : undefined"
        >
          <IconClose v-if="option.kind === 'none'" :size="22" />
          <IconVirtualBg v-else-if="option.kind === 'blur'" :size="22" />
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  useVirtualBackgroundState,
  VirtualBackgroundEvent,
  VirtualBackgroundType,
} from 'tuikit-atomicx-vue3/room';
import type { VirtualBackgroundConfig } from 'tuikit-atomicx-vue3/room';
import { IconClose, IconVirtualBg, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import backdrop from './assets/backdrop.jpeg';
import cafe from './assets/cafe.jpeg';
import classroom from './assets/classroom.jpeg';
import cityscape from './assets/cityscape.jpeg';
import livingRoom from './assets/living-room.jpeg';
import meetingRoom from './assets/meeting-room.jpeg';
import {
  cachedBackgroundImage,
  createDefaultBackgroundOptions,
  ERR_VIRTUAL_BACKGROUND_PACKAGE_REQUIRED,
  recalledBackgroundId,
  resolveBackgroundImagePath,
  resolveSelectedBackgroundId,
  toVirtualBackgroundParams,
  VIRTUAL_BACKGROUND_ASSETS_PATH,
} from './virtualBackground';
import type { BackgroundOption, VirtualBackgroundParams } from './virtualBackground';

defineOptions({ name: 'VirtualBackgroundSettings' });

const props = withDefaults(defineProps<{
  previewReady?: boolean;
}>(), {
  previewReady: true,
});

const {
  virtualBackgroundConfig,
  initVirtualBackground,
  setVirtualBackground,
  saveVirtualBackground,
  isSupported,
  subscribeEvent,
  unsubscribeEvent,
} = useVirtualBackgroundState();

const BACKGROUND_PHOTOS = [
  { id: 'g1', imagePath: meetingRoom },
  { id: 'g2', imagePath: cafe },
  { id: 'g3', imagePath: cityscape },
  { id: 'g4', imagePath: livingRoom },
  { id: 'g5', imagePath: classroom },
  { id: 'g6', imagePath: backdrop },
];

const options = ref<BackgroundOption[]>(hydratePhotoPaths(createDefaultBackgroundOptions(BACKGROUND_PHOTOS)));
const selectedId = ref('none');
const isReady = ref(false);

const supported = computed(() => {
  try {
    return isSupported();
  } catch {
    return false;
  }
});

function hydratePhotoPaths(list: BackgroundOption[]): BackgroundOption[] {
  return list.map((option) => {
    if (option.kind !== 'image') {
      return option;
    }
    const imagePath = cachedBackgroundImage(option.id);
    return imagePath ? { ...option, imagePath } : option;
  });
}

function labelFor(option: BackgroundOption): string {
  if (option.kind === 'none') {
    return t('VirtualBackground.Close');
  }
  if (option.kind === 'blur') {
    return t('VirtualBackground.Blurred');
  }
  return t('VirtualBackground.Custom');
}

function toAtomicConfig(params: VirtualBackgroundParams): VirtualBackgroundConfig {
  if (!params.enable) {
    return { enable: false };
  }
  if (params.type === 'blur') {
    return { enable: true, type: VirtualBackgroundType.blur };
  }
  return {
    enable: true,
    type: VirtualBackgroundType.image,
    imagePath: params.imagePath,
  };
}

function showError(error: unknown, fallbackKey: string) {
  const code = (error as { code?: number } | undefined)?.code;
  const messageKey = code === ERR_VIRTUAL_BACKGROUND_PACKAGE_REQUIRED
    ? 'VirtualBackground.PackageRequired'
    : fallbackKey;
  TUIToast.error(t(messageKey));
}

function handleAbort() {
  TUIToast.error(t('VirtualBackground.Aborted'));
}

function restoreSelection() {
  const config = virtualBackgroundConfig.value as VirtualBackgroundParams | undefined;
  const recalled = config?.type === 'image' ? recalledBackgroundId(config.imagePath) : undefined;
  selectedId.value = recalled ?? resolveSelectedBackgroundId(config, options.value);
}

async function apply(option: BackgroundOption) {
  const imagePath = await resolveBackgroundImagePath(option);
  const next = option.kind === 'image' ? { ...option, imagePath } : option;
  if (option.kind === 'image') {
    options.value = options.value.map(item => (item.id === option.id ? next : item));
  }
  const config = toAtomicConfig(toVirtualBackgroundParams(next));
  await setVirtualBackground(config);
  // setVirtualBackground only enables the camera-test preview. Persist onto
  // the published conference stream immediately so the in-room view updates.
  await saveVirtualBackground();
}

async function applyCurrent() {
  const current = options.value.find(item => item.id === selectedId.value) ?? options.value[0];
  if (!current || !props.previewReady) {
    return;
  }
  await apply(current);
}

async function select(id: string) {
  if (!isReady.value) {
    return;
  }
  const option = options.value.find(item => item.id === id);
  if (!option) {
    return;
  }
  selectedId.value = id;
  try {
    await apply(option);
  } catch (error) {
    showError(error, 'VirtualBackground.ApplyFailed');
  }
}

onMounted(async () => {
  subscribeEvent(VirtualBackgroundEvent.onAbort, handleAbort);
  if (!supported.value) {
    TUIToast.error(t('VirtualBackground.NotSupported'));
    return;
  }
  try {
    await initVirtualBackground({ assetsPath: VIRTUAL_BACKGROUND_ASSETS_PATH });
    restoreSelection();
    isReady.value = true;
    await applyCurrent();
  } catch (error) {
    showError(error, 'VirtualBackground.InitializeFailed');
  }
});

watch(() => props.previewReady, (ready) => {
  if (ready && isReady.value) {
    applyCurrent().catch((error: unknown) => {
      showError(error, 'VirtualBackground.ApplyFailed');
    });
  }
});

onUnmounted(() => {
  unsubscribeEvent(VirtualBackgroundEvent.onAbort, handleAbort);
});
</script>

<style scoped lang="scss">
.virtual-background-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.virtual-background-item {
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  aspect-ratio: 4 / 3;
  padding: 3px;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: border-color var(--rk-duration) var(--rk-ease);
}

.virtual-background-item:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--rk-brand) 35%, transparent);
}

.virtual-background-item.is-active,
.virtual-background-item.is-active:hover {
  border-color: var(--rk-brand);
}

.virtual-background-item:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.virtual-background-face {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--rk-bg-muted);
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  border-radius: 8px;
}

.virtual-background-item.is-blur .virtual-background-face {
  background-color: color-mix(in srgb, #e7e2d8 70%, var(--rk-bg-muted));
}
</style>
