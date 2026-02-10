<template>
  <TUIDialog
    v-model:visible="visible"
    :title="t('Room.EnterPassword')"
    :show-close="false"
    :modal="false"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <TUIInput
      v-model="password"
      type="number"
      show-password
      max-length="6"
      :placeholder="t('Room.EnterPasswordPlaceholder')"
      @keyup.enter="handleConfirm"
    />
  </TUIDialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { TUIDialog, TUIInput, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';

interface Props {
  modelValue: boolean;
  roomId: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success', data: { roomId: string; password: string }): void;
  (e: 'cancel'): void;
  (e: 'error', error: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useUIKit();
const { joinRoom } = useRoomState();

const visible = ref(false);
const password = ref('');
const isJoining = ref(false);

watch(() => props.modelValue, (val) => {
  visible.value = val;
});

watch(visible, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    password.value = '';
  }
});

const handleConfirm = async () => {
  if (!password.value) {
    TUIToast.error({ message: t('Room.EnterPassword') });
    return;
  }

  if (isJoining.value) {
    return;
  }

  try {
    isJoining.value = true;
    await joinRoom({
      roomId: props.roomId,
      password: password.value,
    });

    visible.value = false;
    password.value = '';
    emit('success', { roomId: props.roomId, password: password.value });
  } catch (error) {
    console.error('Failed to join room with password:', error);
    emit('error', error);
  } finally {
    isJoining.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
  password.value = '';
  emit('cancel');
};
</script>

<style lang="scss" scoped>
.button-container {
    display: flex;
    gap: 12px;
    width: 100%;
    justify-content: center;
    padding: 20px;
}
</style>
