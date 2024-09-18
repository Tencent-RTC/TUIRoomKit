<template>
  <div class="member-control-container">
    <div class="member-title">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl" />
      <div class="member-title-content">
        {{ roomService.getDisplayName(userInfo) }}
      </div>
      <span
        v-if="isWeChat"
        v-tap.stop="handleCloseControl"
        class="tab-cancel"
        >{{ t('Cancel') }}</span>
    </div>
    <div
      v-for="item in controlList"
      :key="item.key"
      v-tap="() => item.func(userInfo)"
      class="user-operate-item"
    >
      <svg-icon :icon="item.icon" class="icon-svg" />
      <div class="control-title">{{ item.title }}</div>
    </div>
    <Dialog
      v-model="isDialogVisible"
      :title="dialogData.title"
      width="480px"
      :modal="true"
      :append-to-room-container="true"
      :confirm-button="dialogData.confirmText"
      :cancel-button="t('Cancel')"
      @confirm="handleAction(props.userInfo)"
      @cancel="handleCancelDialog"
    >
      <span>{{ dialogData.content }}</span>
    </Dialog>
    <div
      class="input-content-container"
      ref="editorInputEleContainer"
      v-tap.stop="handleCloseInput"
      v-show="isShowInput"
    >
      <div class="input-content">
        <div class="input">
          <tui-input
            ref="editorInputEle"
            :theme="roomService.basicStore.defaultTheme"
            :model-value="tempUserName"
            type="text"
            enterkeyhint="done"
            @input="tempUserName = $event"
            @done="handleAction(props.userInfo)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Avatar from '../../common/Avatar.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { isWeChat } from '../../../utils/environment';
import Dialog from '../../common/base/Dialog';
import vTap from '../../../directives/vTap';
import useMemberControlHooks from './useMemberControlHooks';
import { useI18n } from '../../../locales';
import { UserInfo } from '../../../stores/room';
import { roomService } from '../../../services';
import TuiInput from '../../common/base/Input';

interface Props {
  userInfo: UserInfo;
  showMemberControl: boolean;
}

const props = defineProps<Props>();

const { t } = useI18n();
const {
  controlList,
  handleCancelDialog,
  handleAction,
  isDialogVisible,
  dialogData,
  tempUserName,
  isShowInput,
  editorInputEleContainer,
  editorInputEle,
} = useMemberControlHooks(props);

const emit = defineEmits(['on-close-control']);

function handleCloseControl() {
  isShowInput.value = false;
  emit('on-close-control');
}

function handleCloseInput(event: any) {
  if (isWeChat) {
    isShowInput.value = false;
  } else if (event.target !== event.currentTarget) {
    return;
  } else {
    isShowInput.value = false;
  }
}
</script>

<style lang="scss" scoped>
.member-control-container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column !important;
  width: 100%;
  padding: 22px 16px;
  background: var(--member-control-background-color-h5);
  border-radius: 15px 15px 0 0;
  animation-name: popup;
  animation-duration: 200ms;

  @keyframes popup {
    from {
      transform: scaleY(0);
      transform-origin: bottom;
    }

    to {
      transform: scaleY(1);
      transform-origin: bottom;
    }
  }

  .member-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;

    .avatar-url {
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }

    .member-title-content {
      margin-left: 10px;
      font-size: 16px;
      font-weight: 500;
      line-height: 22px;
      color: var(--member-title-content-h5);
    }
  }

  .user-operate-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding-top: 10px;

    .control-title {
      margin-left: 10px;
    }
  }
}

.agree-button,
.cancel-button {
  display: flex;
  align-items: center;
  width: 50%;
  padding: 12px;
}

.agree-button {
  color: var(--active-color-1);
}

.tab-cancel {
  flex: 1;
  padding-right: 30px;
  text-align: end;
}

.input-content-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 9999;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--log-out-mobile);

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
    color: #676c80;
    resize: none;
    background: var(--background-color-1);
    border: none;
  }

  .input {
    width: 100%;
  }

  .content-bottom-input {
    box-sizing: border-box;
    width: 100%;
    height: 35px;
    padding-left: 12px;
    font-family: 'PingFang SC';
    font-size: 16px;
    font-style: normal;
    font-weight: 450;
    line-height: 4vh;
    color: #676c80;
    caret-color: var(--caret-color);
    resize: none;
    background-color: var(--chat-editor-input-color-h5);
    border: none;
    border-radius: 45px;
  }
}
</style>
