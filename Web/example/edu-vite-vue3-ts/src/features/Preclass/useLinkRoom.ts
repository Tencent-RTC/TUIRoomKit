import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * The lobby URL carries `roomId` in two cases: a class link someone opened, or a
 * refresh while in class (HomeView writes it on enter and drops it on exit).
 * A refresh offers a way back; a link only prefills the class id.
 */
export function useLinkRoom() {
  const route = useRoute();
  const router = useRouter();
  const linkRoomId = computed(() => String(route.query.roomId || ''));
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const shouldShowResume = ref(navigation?.type === 'reload' && Boolean(linkRoomId.value));
  /** A class link opened from outside, as opposed to a refresh. */
  const isInviteLink = computed(() => Boolean(linkRoomId.value) && !shouldShowResume.value);

  // Switching role drops `roomId`, which also retires the banner.
  watch(linkRoomId, (roomId) => {
    if (!roomId) shouldShowResume.value = false;
  });

  function dismissResume() {
    shouldShowResume.value = false;
    router.replace({ query: { ...route.query, roomId: undefined } });
  }

  return { linkRoomId, isInviteLink, shouldShowResume, dismissResume };
}
