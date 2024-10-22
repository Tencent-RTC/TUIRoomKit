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
      theme="white"
    >
      <template #suffixIcon>
        <svg-icon
          class="svg-icon"
          @click="inputPassword = ''"
          :icon="CloseInputIcon"
        />
      </template>
    </TuiInput>
    <template #footer>
      <span>
        <tui-button
          class="button"
          size="default"
          :disabled="inputPassword.length === 0"
          @click="joinRoom"
        >
          {{ t('Join') }}
        </tui-button>
        <tui-button
          class="button"
          size="default"
          type="primary"
          @click="cancelInputPassword"
        >
          {{ t('Cancel') }}
        </tui-button>
      </span>
    </template>
  </TuiDialog>
</template>

<script setup lang="ts">
import { ref, Ref, watch, defineProps, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { EventType, roomService } from '../../services';
import { useI18n } from '../../locales';
import TuiDialog from '../common/base/Dialog/index.vue';
import TuiButton from '../common/base/Button.vue';
import TuiInput from '../common/base/Input/index.vue';
import CloseInputIcon from '../common/icons/CloseInputIcon.vue';
import { useBasicStore } from '../../stores/basic';
import svgIcon from '../common/base/SvgIcon.vue';
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
  await roomService.join(roomId.value, {
    isOpenCamera: false,
    isOpenMicrophone: true,
    password: inputPassword.value,
  });
  roomService.emit(EventType.ROOM_JOIN);
}

function cancelInputPassword() {
  inputPassword.value = '';
  roomService.emit(EventType.ROOM_ERROR);
}

watch(
  () => inputPassword.value,
  async (newValue, oldValue) => {
    if (newValue && invalidPasswordRegex.test(newValue)) {
      await nextTick();
      inputPassword.value = newValue.replace(invalidPasswordRegex, '');
    }
  }
);
</script>

<style lang="scss" scoped>
.svg-icon {
  cursor: pointer;
}

.button {
  margin-left: 12px;
}
</style>
