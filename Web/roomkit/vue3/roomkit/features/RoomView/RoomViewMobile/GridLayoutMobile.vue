<template>
  <div
    ref="rootRef"
    class="grid-layout-mobile"
    :class="{ 'is-chrome': chromeVisible }"
    @pointerdown="onChromePointerDown"
    @pointerup="onChromePointerUp"
    @pointercancel="onChromePointerCancel"
  >
    <div
      ref="stageRef"
      class="grid-layout-mobile-body"
    >
      <TUISwiper
        ref="swiperRef"
        v-model="requestedPage"
        :indicator="false"
        :gap="8"
        @change="revealChrome"
      >
        <TUISwiperItem
          v-for="pageView in pages"
          :key="pageView.page"
        >
          <div class="grid-layout-mobile-page">
            <div
              class="grid-layout-mobile-content"
              :class="{ 'is-fill': pageView.fill, 'is-share-page': pageView.sharePage }"
              :style="tileStyle(pageView)"
              @pointerdown="holdZoomedShare"
            >
              <div
                v-for="(streamInfo, index) in pageView.items"
                :key="`${pageView.page}_${streamInfo.participant.userId}_${streamInfo.streamType}`"
                :ref="(tile) => bindScreenTile(tile, streamInfo, pageView.page === view.page)"
                class="grid-layout-mobile-tile"
                :class="{
                  'is-centered': pageView.centerLast && index === pageView.items.length - 1,
                  'is-pair-shifted': pageView.centerLastPair && index >= 3,
                  'is-zoomable': pageView.sharePage && streamInfo.streamType === VideoStreamType.Screen,
                }"
              >
                <RoomParticipantView
                  class="grid-layout-mobile-video"
                  :class="{ 'is-hidden': isCameraOff(streamInfo), 'is-screen': streamInfo.streamType === VideoStreamType.Screen }"
                  :participant="streamInfo.participant"
                  :stream-type="streamInfo.streamType"
                  :fill-mode="streamInfo.streamType === VideoStreamType.Screen ? FillMode.Fit : FillMode.Fill"
                  :lazy-load="tileLazyLoad(pageView.page)"
                />
                <slot
                  name="participantViewUI"
                  :participant="streamInfo.participant"
                  :stream-type="streamInfo.streamType"
                />
              </div>
            </div>
          </div>
        </TUISwiperItem>
      </TUISwiper>

      <div v-if="paged" class="grid-layout-mobile-pager">
        <button
          class="grid-layout-mobile-page-btn"
          type="button"
          :aria-label="t('RoomView.PrevPage')"
          :disabled="view.page <= 0"
          @click="shiftPage(-1)"
          @pointerdown.stop
        >
          <IconChevron class="grid-layout-mobile-page-icon is-prev" :size="14" />
        </button>
        <button
          class="grid-layout-mobile-page-btn"
          type="button"
          :aria-label="t('RoomView.NextPage')"
          :disabled="view.page >= view.pages - 1"
          @click="shiftPage(1)"
          @pointerdown.stop
        >
          <IconChevron class="grid-layout-mobile-page-icon is-next" :size="14" />
        </button>
      </div>
    </div>
    <div v-if="paged" class="grid-layout-mobile-page-ind">
      {{ view.page + 1 }} / {{ view.pages }}
    </div>

    <template v-if="view.sharePage && sharer">
      <div class="grid-layout-mobile-share-who">
        <IconShare :size="12" />
        <span class="grid-layout-mobile-share-who-text">{{ t('RoomView.SharingBy', { name: sharerName }) }}</span>
      </div>

      <div
        v-if="pipParticipant"
        ref="pipRef"
        class="grid-layout-mobile-pip"
        :class="{ 'is-snapping': pipSnapping }"
        role="group"
        :style="pipStyle"
        :aria-label="pipName"
        @pointerdown.stop="handlePipPointerDown"
        @pointermove="handlePipPointerMove"
        @pointerup="handlePipPointerUp"
        @pointercancel="handlePipPointerUp"
        @transitionend.self="pipSnapping = false"
      >
        <RoomParticipantView
          :key="pipParticipant.userId"
          class="grid-layout-mobile-video"
          :class="{ 'is-hidden': isCameraOff({ participant: pipParticipant, streamType: VideoStreamType.Camera }) }"
          :participant="pipParticipant"
          :stream-type="VideoStreamType.Camera"
          :fill-mode="FillMode.Fill"
          :lazy-load="{ enable: false }"
        />
        <slot
          name="participantViewUI"
          :participant="pipParticipant"
          :stream-type="VideoStreamType.Camera"
          :in-pip="true"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import {
  FillMode,
  RoomParticipantView,
  VideoStreamType,
  useLoginState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { IconChevron, IconShare, TUISwiper, TUISwiperItem, t, usePinchZoom } from '../../../base';
import { isCameraOff, useParticipantStreams } from '../useParticipantStreams';
import type { StreamInfo } from '../useParticipantStreams';
import {
  fitMobileTile,
  pageAfterRosterChange,
  pageAfterSharerChange,
  paginateMobileStreams,
} from './mobileGallery';
import type { MobilePage } from './mobileGallery';

const props = defineProps<{
  /** Drawing on the share owns its touches: no zoom, no page swipe. */
  shareLocked?: boolean;
  /** Whose camera the share page's corner window shows; no window when omitted. */
  pipParticipant?: RoomParticipant | null;
}>();

const gap = 4;
/** A press that moves less than this is a tap, not a swipe. */
const tapSlop = 10;
/** Smallest distance the sharer's camera window keeps from the stage edge while dragged. */
const pipInset = 16;

const { loginUserInfo } = useLoginState();
const { participantWithScreen, sortedParticipantCameraList } = useParticipantStreams();

const requestedPage = ref(0);
const stageRef = ref<HTMLDivElement | null>(null);
const swiperRef = ref<InstanceType<typeof TUISwiper> | null>(null);
const stageSize = ref({ width: 0, height: 0 });
const chromeVisible = ref(false);
let chromeTap: { x: number; y: number; id: number } | null = null;

const screenStream = computed<StreamInfo | null>(() =>
  participantWithScreen.value
    ? { participant: participantWithScreen.value, streamType: VideoStreamType.Screen }
    : null,
);

/** Empty for no share or a local share; the sharer's id for a remote share. */
const remoteSharerId = computed(() => {
  const sharerId = participantWithScreen.value?.userId || '';
  const selfId = loginUserInfo.value?.userId || '';
  return sharerId && selfId && sharerId !== selfId ? sharerId : '';
});

const view = computed(() => paginateMobileStreams<StreamInfo>({
  cameras: sortedParticipantCameraList.value,
  screen: screenStream.value,
  remoteShare: !!remoteSharerId.value,
  page: requestedPage.value,
}));

const paged = computed(() => view.value.pages > 1);

function galleryAt(page: number) {
  return paginateMobileStreams<StreamInfo>({
    cameras: sortedParticipantCameraList.value,
    screen: screenStream.value,
    remoteShare: !!remoteSharerId.value,
    page,
  });
}

const pages = computed(() => Array.from({ length: view.value.pages }, (_, page) => galleryAt(page)));

function tileStyle(pageView: MobilePage<StreamInfo>) {
  const { width, height } = fitMobileTile(
    stageSize.value.width,
    stageSize.value.height,
    pageView.columns,
    pageView.rows,
    gap,
  );
  if (pageView.fill || !width || !height) {
    return {};
  }
  return {
    '--grid-layout-mobile-tile-width': `${width}px`,
    '--grid-layout-mobile-gap': `${gap}px`,
    'gridTemplateColumns': `repeat(${pageView.columns}, ${width}px)`,
    'gridTemplateRows': `repeat(${pageView.rows}, ${height}px)`,
    'gap': `${gap}px`,
  };
}

/* The current page and its neighbours pull streams, so a swipe never lands on a blank grid.
   Every lazy tile must share the stage as its root: the player keeps one observer, and
   a tile asking for another root drops every tile observed before it. */
function tileLazyLoad(page: number) {
  if (Math.abs(page - view.value.page) > 1) {
    return { enable: true, viewport: stageRef.value ?? undefined };
  }
  return { enable: false };
}

const screenTileRef = ref<HTMLElement | null>(null);

function bindScreenTile(
  tile: Element | ComponentPublicInstance | null,
  streamInfo: StreamInfo,
  current: boolean,
) {
  if (!current || streamInfo.streamType !== VideoStreamType.Screen) {
    return;
  }
  const el = tile && '$el' in tile ? tile.$el : tile;
  screenTileRef.value = el instanceof HTMLElement ? el : null;
}

const pinchZoom = usePinchZoom(screenTileRef, {
  enabled: computed(() => view.value.sharePage && !props.shareLocked),
});

const sharer = computed(() => participantWithScreen.value);

const sharerName = computed(() =>
  sharer.value?.nameCard || sharer.value?.userName || sharer.value?.userId || '',
);

const pipParticipant = computed(() => props.pipParticipant ?? null);

const pipName = computed(() =>
  pipParticipant.value?.nameCard || pipParticipant.value?.userName || pipParticipant.value?.userId || '',
);

const rootRef = ref<HTMLElement | null>(null);
const pipRef = ref<HTMLElement | null>(null);
/** Null keeps the window at its top-right corner; a drag pins it to a stage offset. */
const pipPosition = ref<{ x: number; y: number } | null>(null);
let pipDrag: { id: number; dx: number; dy: number } | null = null;
/** Animates the release onto the nearer side edge; the drag itself follows the finger. */
const pipSnapping = ref(false);
/** Matches the `.is-snapping` transition, in case `transitionend` never fires. */
const pipSnapDuration = 220;
let pipSnapTimer = 0;

const pipStyle = computed(() => (pipPosition.value
  ? { left: `${pipPosition.value.x}px`, top: `${pipPosition.value.y}px`, right: 'auto' }
  : {}));

watch(remoteSharerId, (next, previous) => {
  requestedPage.value = pageAfterSharerChange(previous || '', next, requestedPage.value);
  pinchZoom.reset();
  if (next && next !== previous) {
    pipPosition.value = null;
  }
});

/** Keep the requested page in range, so a page that empties out does not leave a stale index. */
watch(() => view.value.page, (page) => {
  if (page !== requestedPage.value) {
    requestedPage.value = page;
  }
});

/** Drawing only happens on the share page, and a share pages away from stops playing. */
watch(() => props.shareLocked, (locked) => {
  if (locked && remoteSharerId.value) {
    requestedPage.value = 0;
  }
});

watch(paged, (isPaged) => {
  if (!isPaged) {
    chromeVisible.value = false;
  }
});

/** Someone joining nudges the pager into view, so a new page is not missed. */
watch(() => sortedParticipantCameraList.value.length, (next, previous) => {
  requestedPage.value = pageAfterRosterChange(previous, next, !!screenStream.value, requestedPage.value);
  if (next === previous + 1) {
    revealChrome();
  }
});

function handlePipPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }
  event.preventDefault();
  const pip = event.currentTarget as HTMLElement;
  const rect = pip.getBoundingClientRect();
  pipDrag = { id: event.pointerId, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
  window.clearTimeout(pipSnapTimer);
  pipSnapping.value = false;
  try {
    pip.setPointerCapture(event.pointerId);
  } catch {
    // The pointer may already be gone.
  }
}

function pipElement() {
  const node = pipRef.value as HTMLElement | HTMLElement[] | null;
  if (Array.isArray(node)) {
    return node[0] ?? null;
  }
  return node;
}

function pipStageRect(pip: HTMLElement) {
  return (pip.offsetParent instanceof HTMLElement ? pip.offsetParent : rootRef.value)?.getBoundingClientRect() ?? null;
}

function handlePipPointerMove(event: PointerEvent) {
  const pip = pipElement();
  if (!pipDrag || event.pointerId !== pipDrag.id || !pip) {
    return;
  }
  const stage = pipStageRect(pip);
  if (!stage) {
    return;
  }
  const maxX = stage.width - pip.offsetWidth - pipInset;
  const maxY = stage.height - pip.offsetHeight - pipInset;
  pipPosition.value = {
    x: Math.max(pipInset, Math.min(maxX, event.clientX - stage.left - pipDrag.dx)),
    y: Math.max(pipInset, Math.min(maxY, event.clientY - stage.top - pipDrag.dy)),
  };
}

/** A released window settles on the nearer side edge and keeps its height. */
function snapPip() {
  const pip = pipElement();
  const position = pipPosition.value;
  if (!pip || !position) {
    return;
  }
  const stage = pipStageRect(pip);
  if (!stage) {
    return;
  }
  const rightX = stage.width - pip.offsetWidth - pipInset;
  const x = position.x + pip.offsetWidth / 2 < stage.width / 2 ? pipInset : rightX;
  if (x === position.x) {
    return;
  }
  pipSnapping.value = true;
  pipPosition.value = { x, y: position.y };
  window.clearTimeout(pipSnapTimer);
  pipSnapTimer = window.setTimeout(() => {
    pipSnapping.value = false;
  }, pipSnapDuration + 50);
}

function handlePipPointerUp(event: PointerEvent) {
  if (pipDrag && event.pointerId === pipDrag.id) {
    pipDrag = null;
    snapPip();
  }
}

/** Show the pager and leave it up until the next tap on empty stage. */
function revealChrome() {
  chromeVisible.value = paged.value;
}

/* Any control on the stage stops its own pointerdown, so a press on it never reaches
   here and does not toggle the pager. */
function onChromePointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return;
  }
  chromeTap = { x: event.clientX, y: event.clientY, id: event.pointerId };
}

function onChromePointerUp(event: PointerEvent) {
  if (!chromeTap || event.pointerId !== chromeTap.id) {
    return;
  }
  const dx = event.clientX - chromeTap.x;
  const dy = event.clientY - chromeTap.y;
  chromeTap = null;
  if (Math.hypot(dx, dy) > tapSlop) {
    return;
  }
  if (!paged.value) {
    chromeVisible.value = false;
    return;
  }
  chromeVisible.value = !chromeVisible.value;
}

function onChromePointerCancel(event: PointerEvent) {
  if (chromeTap && event.pointerId === chromeTap.id) {
    chromeTap = null;
  }
}

function shiftPage(direction: number) {
  swiperRef.value?.slideTo(view.value.page + direction);
}

/** A zoomed or annotated share takes one finger; the swiper must not turn that into a page change. */
function holdZoomedShare(event: PointerEvent) {
  if (view.value.sharePage && (pinchZoom.isZoomed.value || props.shareLocked)) {
    event.stopPropagation();
  }
}

let resizeObserver: ResizeObserver | null = null;

function measureStage() {
  const el = stageRef.value;
  if (!el) {
    return;
  }
  const { width, height } = el.getBoundingClientRect();
  if (width !== stageSize.value.width || height !== stageSize.value.height) {
    stageSize.value = { width, height };
    pinchZoom.reset();
  }
}

onMounted(() => {
  measureStage();
  if (stageRef.value) {
    resizeObserver = new ResizeObserver(measureStage);
    resizeObserver.observe(stageRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  chromeTap = null;
  window.clearTimeout(pipSnapTimer);
});
</script>

<style scoped lang="scss">
.grid-layout-mobile {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 8px;
  overflow: visible;
}

.grid-layout-mobile-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.grid-layout-mobile-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.grid-layout-mobile-content {
  display: grid;
  place-content: center;
}

/* place-content: center sizes the row to its content, so a lone tile collapsed to
   the mic icon with the camera off. Stretch the one cell to the stage instead. */
.grid-layout-mobile-content.is-fill {
  position: absolute;
  inset: 0;
  grid-template-rows: minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  place-content: stretch;
}

/* The tile only sets the corners; the participant view rounds its own video to them.
   It must not clip, or the overlay's speaking glow would be cut off. */
.grid-layout-mobile-tile {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--room-view-tile-bg);
  isolation: isolate;
  border-radius: 12px;
}

.grid-layout-mobile-video.is-hidden {
  opacity: 0;
}

.grid-layout-mobile-tile.is-centered {
  grid-column: 1 / -1;
  justify-self: center;
  width: var(--grid-layout-mobile-tile-width);
}

/* Half a column plus half a gap moves the last pair to the middle of the 3-column row. */
.grid-layout-mobile-tile.is-pair-shifted {
  width: var(--grid-layout-mobile-tile-width);
  margin-inline-start: calc((var(--grid-layout-mobile-tile-width) + var(--grid-layout-mobile-gap)) / 2);
}

.grid-layout-mobile-content.is-share-page .grid-layout-mobile-tile {
  background: #000;
  border-radius: 12px;
}

/* A zoomed share grows past its cell; clip it to the stage. */
.grid-layout-mobile-content.is-share-page {
  overflow: hidden;
}

/* The browser must not claim the pinch or the pan of a zoomed share. */
.grid-layout-mobile-tile.is-zoomable {
  touch-action: none;
}

.grid-layout-mobile-pager {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  pointer-events: none;
}

/* Phones have no hover: a tap shows the arrows and the page count, and the next tap hides them. */
.grid-layout-mobile-page-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #fff;
  pointer-events: none;
  cursor: pointer;
  background: color-mix(in srgb, #000 42%, transparent);
  border: 0;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.16s ease, transform 0.16s ease;
  transform: scale(0.92);
}

.grid-layout-mobile.is-chrome .grid-layout-mobile-page-btn {
  pointer-events: auto;
  opacity: 1;
  transform: scale(1);
}

.grid-layout-mobile.is-chrome .grid-layout-mobile-page-btn:disabled {
  pointer-events: none;
  cursor: default;
  opacity: 0.22;
}

.grid-layout-mobile-page-icon.is-prev {
  transform: rotate(90deg);
}

.grid-layout-mobile-page-icon.is-next {
  transform: rotate(-90deg);
}

.grid-layout-mobile-page-ind {
  position: absolute;
  bottom: 8px;
  left: 50%;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  height: 20px;
  padding: 0 8px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #fff;
  pointer-events: none;
  background: color-mix(in srgb, #000 42%, transparent);
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.16s ease;
  transform: translateX(-50%);
}

.grid-layout-mobile.is-chrome .grid-layout-mobile-page-ind {
  opacity: 1;
}

.grid-layout-mobile-share-who {
  position: absolute;
  top: auto;
  right: auto;
  bottom: 20px;
  left: 20px;
  z-index: 12;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  width: max-content;
  max-width: calc(100% - 24px);
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 22px;
  color: rgba(255, 255, 255, 0.78);
  white-space: nowrap;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 999px;
  transform: none;
}

.grid-layout-mobile-share-who-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The speaker's camera rides on the share page; dragging stays inside the stage. */
.grid-layout-mobile-pip {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 13;
  width: 112px;
  aspect-ratio: 9 / 16;
  touch-action: none;
  cursor: grab;
  user-select: none;
  background: var(--room-view-tile-bg);
  isolation: isolate;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.grid-layout-mobile-pip:active {
  cursor: grabbing;
}

.grid-layout-mobile-pip.is-snapping {
  transition: left 220ms var(--rk-ease), top 220ms var(--rk-ease);
}

/* The speaking ring and the camera-off mask inherit their corners from the view. */
.grid-layout-mobile-pip > :deep(.atomicx-participant-view) {
  border-radius: inherit;
}
</style>
