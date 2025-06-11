<template>
  <tui-dialog
    v-model="isShowDialog"
    :title="t('change name')"
    :modal="true"
    width="480px"
    :before-close="handleCancel"
    :close-on-click-modal="true"
    :append-to-room-container="true"
  >
    <div class="dialog-content">
      <tui-input
        :model-value="inputUserName"
        @input="inputUserName = $event"
        class="dialog-input"
        :placeholder="t('Please input user name')"
      />
    </div>
    <template #footer>
      <TUIButton
        type="primary"
        style="min-width: 88px"
        @click="handleConfirm"
        :disabled="isConfirmButtonDisable"
      >
        {{ t('Confirm') }}
      </TUIButton>
      <TUIButton style="min-width: 88px" @click="handleCancel">
        {{ t('Cancel') }}
      </TUIButton>
    </template>
  </tui-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';
import { TuiDialog, TuiInput } from '../../../../../components/common/base';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../../../../locales';
import { UserInfo } from '../../../../type';

interface Props {
  userInfo: UserInfo;
  confirmFunction: (name: string) => void;
}

const props = defineProps<Props>();
const { t } = useI18n();

const inputUserName = ref(props.userInfo.nameCard);
const isShowDialog = ref(true);
const isConfirmButtonDisable = computed(() => !inputUserName.value.trim());

async function handleConfirm() {
  await props.confirmFunction(inputUserName.value);
  isShowDialog.value = false;
}

function handleCancel() {
  inputUserName.value =
    props.userInfo.nameCard || props.userInfo.userName || '';
  isShowDialog.value = false;
}
</script>

<style lang="scss" scoped>
.dialog-content {
  display: flex;
  align-items: center;

  .dialog-input {
    flex-grow: 1;
  }
}
</style>
