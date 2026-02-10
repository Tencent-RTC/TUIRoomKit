<template>
  <div :class="['join-room-container-h5', theme]">
    <header class="header-h5">
      <IconBack size="22" class="back-button" @click="handleGoBack" />
      <h1 class="title">
        {{ t('Button.JoinRoom') }}
      </h1>
      <div class="header-placeholder"></div>
    </header>

    <main class="main-h5">
      <div class="room-info">
        <div class="form-item">
          <TUIInput
            v-model="roomId"
            :label="t('Room.RoomId')"
            class="form-input"
            :placeholder="t('Room.EnterRoomId')"
            max-length="6"
          />
        </div>

        <div class="form-item">
          <span class="form-label">{{ t('User.Nickname') }}</span>
          <span class="form-input">{{
            loginUserInfo?.userName || loginUserInfo?.userId
          }}</span>
        </div>
      </div>

      <div class="room-settings">
        <div class="form-item toggle-item">
          <span class="form-label">{{ t('Room.OpenMicrophone') }}</span>
          <TUISwitch v-model="openMicrophone" size="large" />
        </div>

        <div class="form-item toggle-item">
          <span class="form-label">{{ t('Room.OpenCamera') }}</span>
          <TUISwitch v-model="openCamera" size="large" />
        </div>
      </div>
    </main>
    <div class="footer-h5">
      <TUIButton
        type="primary"
        class="join-button"
        :loading="loading"
        @click="handleJoinRoom"
      >
        {{ t('Button.JoinRoom') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  useUIKit,
  TUIToast,
  TUIMessageBox,
  IconBack,
  TUISwitch,
  TUIButton,
  TUIInput,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState, useLoginState } from 'tuikit-atomicx-vue3/room';

interface Emits {
  (e: 'join-room', roomId: string): void;
  (e: 'back'): void;
  (e: 'camera-preference-change', isOpen: boolean): void;
  (e: 'microphone-preference-change', isOpen: boolean): void;
}
interface Props {
  cameraPreference?: boolean;
  microphonePreference?: boolean;
}

const emit = defineEmits<Emits>();
const props = withDefaults(defineProps<Props>(), {
  cameraPreference: true,
  microphonePreference: true,
});

const { t, theme, language } = useUIKit();
const { loginUserInfo } = useLoginState();
const { getRoomInfo } = useRoomState();

const roomId = ref('');
const openMicrophone = ref(props.microphonePreference);
const openCamera = ref(props.cameraPreference);
const loading = ref(false);

watch(openMicrophone, newVal => {
  emit('microphone-preference-change', newVal);
});

watch(openCamera, newVal => {
  emit('camera-preference-change', newVal);
});

const labelWidth = computed(() => {
  if (language.value === 'en-US') {
    return '115px';
  }
  return '80px';
});

const handleGoBack = () => {
  emit('back');
};

const checkRoomExist = async (id: string) => {
  try {
    await getRoomInfo({ roomId: id });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST
    ) {
      return false;
    }
  }
  return true;
};

const handleJoinRoom = async () => {
  loading.value = true;
  if (!roomId.value.trim()) {
    TUIToast.error({ message: t('Room.RoomIdRequired') });
    return;
  }

  try {
    const exists = await checkRoomExist(roomId.value.trim());

    if (!exists) {
      TUIMessageBox.alert({
        type: 'error',
        modal: false,
        showClose: false,
        title: t('Room.Alert'),
        content: t('Room.RoomNotFound'),
      });
      return;
    }

    emit('join-room', roomId.value.trim());
  } catch (error: unknown) {
    const errorMessage =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : t('Room.JoinRoomError');
    TUIToast.error({ message: errorMessage });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@mixin card-container-h5 {
  border-radius: 10px;
  background-color: var(--bg-color-operate);
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

@mixin font-text-h5 {
  font-family:
    PingFang SC,
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-color-primary);
}

@mixin active-state {
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.6;
  }
}

.join-room-container-h5 {
  height: 100%;
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-default);
  @include font-text-h5;
  -webkit-tap-highlight-color: transparent;

  @supports (height: 100dvh) {
    height: 100dvh;
  }
}

.header-h5 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--bg-color-operate);

  .back-button {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    @include active-state;
  }

  .title {
    flex: 1;
    text-align: center;
    font-size: 17px;
    font-weight: 600;
    color: var(--text-color-primary);
    margin: 0;
  }

  .header-placeholder {
    width: 40px;
  }
}

.main-h5 {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
}

.footer-h5 {
  padding: 16px;
  background-color: var(--bg-color-default);
}

.form-item {
  display: flex;
  align-items: center;
  min-height: 32px;

  &.toggle-item {
    justify-content: space-between;
  }

  .form-label {
    flex-shrink: 0;
    min-width: v-bind(labelWidth);
    margin-right: 12px;
  }

  .form-input {
    flex: 1;
  }
}

.room-info,
.room-settings {
  @include card-container-h5;
}

.join-button {
  width: 100%;
  height: 50px;
  @include active-state;

  &:active {
    opacity: 0.8;
  }
}

:deep(.tui-input--mobile.tui-input--with-label) {
  padding: 0 !important;
  .tui-input__label {
    min-width: v-bind(labelWidth);
  }
}
</style>
