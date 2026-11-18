import { computed, onScopeDispose, ref } from 'vue';
import { useRoomState } from 'tuikit-atomicx-vue3/room';

/**
 * Class timer for education rooms, shared by the PC and Mobile chips.
 * The booked start time is the source of truth: the room's create time only
 * records when the teacher walked in. `currentRoom` carries the booked
 * seconds for scheduled classes; ad-hoc rooms have none. A class entered
 * early shows no timer until the booked time arrives; ad-hoc classes keep
 * the create-time clock.
 */
export function useEduClassTimer() {
  const { currentRoom } = useRoomState();
  const now = ref(Date.now());
  const clock = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  onScopeDispose(() => clearInterval(clock));

  const scheduledStartMs = computed(() => {
    const start = currentRoom.value?.scheduledStartTime;
    return start ? start * 1000 : 0;
  });
  /** The booked time has arrived; ad-hoc classes read as started. */
  const classStarted = computed(
    () => !scheduledStartMs.value || now.value >= scheduledStartMs.value,
  );

  return computed(() => {
    if (!classStarted.value) {
      return '';
    }
    const start = scheduledStartMs.value || currentRoom.value?.createTime;
    return start ? formatElapsedMs(now.value - start) : '00:00';
  });
}

/** hh:mm:ss past one hour, mm:ss below it. */
function formatElapsedMs(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
  return parts.map(value => String(value).padStart(2, '0')).join(':');
}
