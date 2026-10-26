<template>
  <!-- The control keeps one instance wherever it sits, so unread counts and pending
       confirms survive the move between the bar and the more sheet. -->
  <Teleport :to="target" :disabled="!inSheet">
    <div
      class="overflow-item-mobile"
      :class="{ 'is-in-sheet': inSheet, 'is-stashed': stashed, 'is-empty': !present }"
      :style="inSheet ? { order } : undefined"
    >
      <div ref="controlRef" class="overflow-item-mobile-control">
        <slot />
      </div>
      <span v-if="inSheet" class="overflow-item-mobile-label">{{ label }}</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{
  overflowed: boolean;
  /** Grid inside the more sheet; null while the sheet is closed */
  target: HTMLElement | null;
  /** Slot position, so the grid keeps toolbar order whatever order items arrive in */
  order: number;
}>();

const emit = defineEmits<{
  'update:present': [present: boolean];
}>();

const controlRef = ref<HTMLElement | null>(null);
const label = ref('');
const present = ref(false);
const inSheet = computed(() => props.overflowed && !!props.target);
// Back in the bar while the sheet is closed, but it must not take a slot there.
const stashed = computed(() => props.overflowed && !props.target);

let observer: MutationObserver | null = null;

function sync() {
  const control = controlRef.value;
  const element = control?.firstElementChild as HTMLElement | null | undefined;
  label.value = element?.getAttribute('aria-label')
    || element?.querySelector('[aria-label]')?.getAttribute('aria-label')
    || '';
  // A control hidden by its own v-if (recording for a plain member) leaves only a comment behind.
  const next = !!element;
  if (next !== present.value) {
    present.value = next;
    emit('update:present', next);
  }
}

onMounted(() => {
  if (!controlRef.value) {
    return;
  }
  observer = new MutationObserver(sync);
  observer.observe(controlRef.value, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label'],
  });
  sync();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  if (present.value) {
    emit('update:present', false);
  }
});
</script>

<style scoped lang="scss">
/* On the bar the wrapper adds no box, so the bar's own gap spaces the controls
   and an empty item takes no gap at all. */
.overflow-item-mobile,
.overflow-item-mobile-control {
  display: contents;
}

.overflow-item-mobile.is-empty,
.overflow-item-mobile.is-stashed {
  display: none;
}

.overflow-item-mobile.is-in-sheet {
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
  min-width: 0;
  padding: 10px 2px;
}

.overflow-item-mobile.is-in-sheet.is-empty {
  display: none;
}

.overflow-item-mobile-label {
  max-width: 100%;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.2;
  color: var(--rk-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
