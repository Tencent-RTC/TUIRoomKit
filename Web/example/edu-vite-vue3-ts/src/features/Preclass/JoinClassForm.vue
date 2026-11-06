<template>
  <form class="preclass-join" :class="{ 'is-h5': !isPC }" novalidate @submit.prevent="submit">
    <label class="preclass-join-label">
      {{ t('Preclass.RoomId') }}
      <TUIInput
        v-model="roomId"
        clearable
        inputmode="numeric"
        :size="isPC ? 'sm' : 'lg'"
        :maxlength="ROOM_ID_MAX_LENGTH"
        :placeholder="t('Preclass.JoinRoomIdPlaceholder')"
      />
    </label>
    <TUIButton
      class="preclass-join-submit"
      variant="primary"
      native-type="submit"
      :size="isPC ? 'sm' : 'lg'"
      :block="!isPC"
      :disabled="!roomId"
    >
      {{ t('Preclass.Join') }}
    </TUIButton>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getPlatform } from '@tencentcloud/universal-api';
import { TUIButton, TUIInput, TUIToast, t } from '@tencentcloud/roomkit-web-vue3';

const ROOM_ID_MAX_LENGTH = 9;

const props = defineProps<{
  /** Prefilled from a class link. */
  initialRoomId?: string;
}>();

const emit = defineEmits<{
  join: [roomId: string];
}>();

const isPC = getPlatform() === 'pc';
const roomId = ref(props.initialRoomId ?? '');

function submit() {
  const trimmedRoomId = String(roomId.value ?? '').trim();
  if (!trimmedRoomId) {
    TUIToast.info(t('Preclass.EmptyRoomId'));
    return;
  }
  if (!/^\d+$/.test(trimmedRoomId)) {
    TUIToast.info(t('Preclass.InvalidRoomId'));
    return;
  }
  // Drops the H5 keyboard before the room view takes over.
  (document.activeElement as HTMLElement | null)?.blur();
  emit('join', trimmedRoomId);
}
</script>

<style scoped lang="scss">
.preclass-join {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 18px 12px;
}

.preclass-join.is-h5 {
  padding: 12px 12px 14px;
  overflow: auto;
}

.preclass-join-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--rk-text-secondary);
}

.preclass-join.is-h5 .preclass-join-label {
  font-size: 14px;
}

.preclass-join-submit {
  align-self: flex-end;
  margin-top: 16px;
}
</style>
