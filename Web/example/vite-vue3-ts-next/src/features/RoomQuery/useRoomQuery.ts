import { onScopeDispose, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

function roomIdFromHref(href: string): string {
  const url = new URL(href, 'http://localhost');
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(hashQuery).get('roomId') || url.searchParams.get('roomId') || '';
}

function currentRoomId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return roomIdFromHref(window.location.href);
}

export function useRoomQuery() {
  const route = useRoute();
  const router = useRouter();
  const roomId = ref(currentRoomId());

  function publish() {
    roomId.value = currentRoomId();
  }

  watch(() => route.fullPath, publish);

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', publish);
    window.addEventListener('popstate', publish);
    onScopeDispose(() => {
      window.removeEventListener('hashchange', publish);
      window.removeEventListener('popstate', publish);
    });
  }

  return {
    roomId,
    sync: (nextRoomId: string) => router.replace({ query: { roomId: nextRoomId } }).finally(publish),
    clear: () => router.replace({ query: {} }).finally(publish),
  };
}
