<template>
  <div
    class="input-content-container"
    ref="editorInputEleContainer"
    v-tap.stop="handleCloseInput"
    v-if="isShowInput"
  >
    <div class="input-content">
      <div class="input">
        <tui-input
          ref="editorInputEle"
          :theme="roomService.basicStore.defaultTheme"
          :model-value="inputUserName"
          type="text"
          enterkeyhint="done"
          @input="inputUserName = $event"
          @done="handleConfirm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, defineProps } from 'vue';
import { TuiInput } from '../../../../../components/common/base';
import { isWeChat } from '../../../../../utils/environment';
import { roomService } from '../../../../../services';
import { UserInfo } from '../../../../type';
import vTap from '../../../../../directives/vTap';

interface Props {
  userInfo: UserInfo;
  confirmFunction: (name: string) => void;
}

const props = defineProps<Props>();

const isShowInput: Ref<boolean> = ref(true);
const inputUserName = ref(props.userInfo.nameCard);

function handleCloseInput(event: any) {
  if (isWeChat) {
    isShowInput.value = false;
  } else if (event.target !== event.currentTarget) {
    return;
  } else {
    isShowInput.value = false;
  }
}

async function handleConfirm() {
  await props.confirmFunction(inputUserName.value);
  isShowInput.value = false;
}
</script>

<style lang="scss" scoped>
.input-content-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 9998;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--uikit-color-black-3);

  .input-content {
    position: absolute;
    bottom: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px;
    font-family: 'PingFang SC';
    font-size: 16px;
    font-style: normal;
    font-weight: 450;
    line-height: 4vh;
    color: var(--text-color-secondary);
    resize: none;
    background-color: var(--bg-color-topbar);
    border: none;
  }

  .input {
    width: 100%;
  }
}
</style>
