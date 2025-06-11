<template>
  <TuiDialog
    v-model="isShowPasswordContainer"
    :title="t('The room is encrypted')"
    :modal="true"
    :show-close="false"
    :close-on-click-modal="false"
    width="420px"
    :append-to-body="true"
    :confirm-button="t('Join')"
    :cancel-button="t('Cancel')"
    @confirm="joinRoom"
    @cancel="cancelInputPassword"
  >
    <TuiInput
      :model-value="inputPassword"
      @input="inputPassword = $event"
      :placeholder="t('Please enter the password')"
      type="password"
      maxlength="32"
    >
      <template #suffixIcon>
        <IconCloseInput @click="inputPassword = ''" class="svg-icon" />
      </template>
    </TuiInput>
    <template #footer>
      <span>
        <TUIButton
          :disabled="isJoinButtonDisable"
          @click="joinRoom"
          type="primary"
          style="min-width: 88px"
        >
          {{ t('Join') }}
        </TUIButton>
        <TUIButton @click="cancelInputPassword" style="min-width: 88px">
          {{ t('Cancel') }}
        </TUIButton>
      </span>
    </template>
  </TuiDialog>
</template>

<script setup lang="ts">
import { ref, Ref, watch, defineProps, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import {
  TUIButton,
  IconCloseInput,
} from '@tencentcloud/uikit-base-component-vue3';
import { EventType, roomService } from '../../services';
import { useI18n } from '../../locales';
import TuiDialog from '../common/base/Dialog';
import TuiInput from '../common/base/Input';
import { useBasicStore } from '../../stores/basic';
import { invalidPasswordRegex } from '../../utils/common';

const basicStore = useBasicStore();
const { roomId } = storeToRefs(basicStore);

interface Props {
  visible: boolean;
}

const { t } = useI18n();
const inputPassword: Ref<string> = ref('');
const props = defineProps<Props>();
const isShowPasswordContainer = ref(false);
const isJoiningRoom = ref(false);

const isJoinButtonDisable = computed(
  () => inputPassword.value.length === 0 || isJoiningRoom.value
);

watch(
  () => props.visible,
  val => {
    isShowPasswordContainer.value = val;
  },
  {
    immediate: true,
  }
);

async function joinRoom() {
  try {
    isJoiningRoom.value = true;
    await roomService.join(roomId.value, {
      isOpenCamera: false,
      isOpenMicrophone: true,
      password: inputPassword.value,
    });
    roomService.emit(EventType.ROOM_JOIN);
  } catch (error) {
    isJoiningRoom.value = false;
  }
}

function cancelInputPassword() {
  inputPassword.value = '';
  roomService.emit(EventType.ROOM_ERROR);
}

watch(
  () => inputPassword.value,
  async val => {
    if (val && invalidPasswordRegex.test(val)) {
      await nextTick();
      inputPassword.value = val.replace(invalidPasswordRegex, '');
    }
  }
);
</script>

<style lang="scss" scoped>
.svg-icon {
  cursor: pointer;
}
</style>
