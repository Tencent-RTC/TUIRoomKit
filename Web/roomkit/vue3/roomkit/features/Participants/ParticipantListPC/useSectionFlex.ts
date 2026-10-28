import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { WatchSource } from 'vue';

function sectionContentHeight(section: HTMLElement | null): number {
  if (!section) {
    return 0;
  }
  const heading = section.querySelector('.participant-panel-heading');
  const rows = section.querySelector('.participant-panel-rows');
  const styles = getComputedStyle(section);
  return Number.parseFloat(styles.paddingTop)
    + Number.parseFloat(styles.borderTopWidth)
    + (heading instanceof HTMLElement ? heading.offsetHeight : 0)
    + (rows instanceof HTMLElement ? rows.scrollHeight : 0);
}

/**
 * Splits the panel body between the joined and pending groups. A group is
 * "tall" when its natural content would exceed half the body; only tall groups
 * grow, and both are capped at half when both are tall.
 */
export function useSectionFlex(content: WatchSource) {
  const bodyRef = ref<HTMLElement | null>(null);
  const joinedSectionRef = ref<HTMLElement | null>(null);
  const pendingSectionRef = ref<HTMLElement | null>(null);
  const joinedTall = ref(false);
  const pendingTall = ref(false);
  const isBothTall = computed(() => joinedTall.value && pendingTall.value);
  let resizeObserver: ResizeObserver | null = null;

  function syncSectionFlex() {
    const body = bodyRef.value;
    if (!body) {
      return;
    }
    const cap = body.clientHeight / 2;
    joinedTall.value = sectionContentHeight(joinedSectionRef.value) > cap;
    pendingTall.value = sectionContentHeight(pendingSectionRef.value) > cap;
  }

  function observeSections() {
    if (!resizeObserver) {
      return;
    }
    resizeObserver.disconnect();
    [bodyRef.value, joinedSectionRef.value, pendingSectionRef.value].forEach((element) => {
      if (element) {
        resizeObserver?.observe(element);
      }
    });
    syncSectionFlex();
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(syncSectionFlex);
    observeSections();
  });
  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
  watch([bodyRef, joinedSectionRef, pendingSectionRef], observeSections);
  watch(content, () => {
    void nextTick(syncSectionFlex);
  });

  return { bodyRef, joinedSectionRef, pendingSectionRef, joinedTall, pendingTall, isBothTall };
}
