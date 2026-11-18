import { computed, effectScope, onScopeDispose, shallowRef, watch } from 'vue';
import { useChatContext } from 'tuikit-atomicx-vue3/chat';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { SILENCE_ALL_EVENT_ID, latestProtocolEvent, sendNotice } from '../customMessage';
import { selfDisplayName } from './memberNotice';

/**
 * Room chat silence-all on the class-event protocol: the state itself rides
 * the chat timeline (the last delivered chat-disabled / chat-allowed event
 * wins; a send still in flight or already failed is not state yet). The
 * engine-wide message disable is never
 * touched — it silences the sender's IM account too, and then blocks these
 * very timeline events from being delivered. Late joiners read the state
 * from roaming history like every other class event.
 * The chat channel follows the current room, so a view can set this up
 * before join and still read the class timeline once the room id exists.
 */
export function useSilenceAll() {
  const { currentRoom } = useRoomState();
  const messages = shallowRef<readonly MessageInfo[]>([]);
  let stopChannel: (() => void) | undefined;

  watch(() => currentRoom.value?.roomId || '', (roomId) => {
    stopChannel?.();
    stopChannel = undefined;
    if (!roomId) {
      messages.value = [];
      return;
    }
    const scope = effectScope();
    scope.run(() => {
      const { messageList } = useChatContext(roomId);
      watch(messageList, (list) => {
        messages.value = list ?? [];
      }, { immediate: true });
    });
    stopChannel = () => scope.stop();
  }, { immediate: true });

  onScopeDispose(() => stopChannel?.());

  const silenceAll = computed(() => {
    const envelope = latestProtocolEvent(
      messages.value,
      SILENCE_ALL_EVENT_ID,
      ['chat-disabled', 'chat-allowed'],
    );
    return envelope ? envelope.event === 'chat-disabled' : false;
  });

  /** Flips the class-wide silence by publishing the state on the timeline. */
  async function toggleSilenceAll(): Promise<void> {
    const roomId = currentRoom.value?.roomId || '';
    const next = !silenceAll.value;
    await sendNotice(SILENCE_ALL_EVENT_ID, roomId, next ? 'chat-disabled' : 'chat-allowed', {
      actor: selfDisplayName(),
    }).catch((error) => {
      console.error('[RoomKit.silenceAll] publish failed:', error);
    });
  }

  return { silenceAll, toggleSilenceAll };
}
