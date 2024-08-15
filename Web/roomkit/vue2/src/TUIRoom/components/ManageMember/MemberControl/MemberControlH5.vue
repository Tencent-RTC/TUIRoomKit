<template>
  <div class="member-control-container">
    <div class="member-title">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl"></Avatar>
      <div class="member-title-content">{{ roomService.getDisplayName(userInfo) }}</div>
      <span v-if="isWeChat" v-tap.stop="handleCloseControl" class="tab-cancel">{{ t('Cancel') }}</span>
    </div>
    <div
      v-for="item in controlList"
      :key="item.key"
      v-tap="() => item.func(userInfo)"
      class="user-operate-item"
    >
      <svg-icon :icon="item.icon" class="icon-svg"></svg-icon>
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
    <div class="input-content-container" ref="editorInputEleContainer" v-tap.stop="handleCloseInput" v-show="isShowInput">
      <div class="input-content" >
        <div class="input">
          <tui-input ref="editorInputEle"
            :theme="roomService.basicStore.defaultTheme"
            :model-value="tempUserName"
            type="text"
            enterkeyhint="done"
            @input="tempUserName = $event"
            @done="handleAction(props.userInfo)">
          </tui-input>
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
import '../../../directives/vTap';
import useMemberControlHooks from './useMemberControlHooks';
import { useI18n } from '../../../locales';
import { UserInfo } from '../../../stores/room';
import { roomService } from '../../../services';
import TuiInput from '../../common/base/Input';

interface Props {
  userInfo: UserInfo,
  showMemberControl: boolean,
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
  if(isWeChat) {
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
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 22px 16px;
  background: var(--member-control-background-color-h5);
  border-radius: 15px 15px 0px 0px;
  display: flex;
  flex-direction: column !important;
  animation-duration: 200ms;
  animation-name: popup;
  @keyframes popup {
  from {
    transform-origin: bottom;
    transform: scaleY(0);
  }
  to {
    transform-origin: bottom;
    transform: scaleY(1);
  }
}
  .member-title{
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-bottom: 10px;
    align-items: center;
    .avatar-url{
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    .member-title-content{
      font-weight: 500;
      font-size: 16px;
      line-height: 22px;
      color: var(--member-title-content-h5);
      margin-left: 10px;
    }
  }
  .user-operate-item {
    width: 100%;
    display: flex;
    padding-top: 10px;
    align-items: center;
    .control-title {
      margin-left: 10px;
    }
  }
}
.agree-button, .cancel-button{
  padding: 12px;
  width: 50%;
  display: flex;
  align-items: center;
}
.agree-button {
  color: var(--active-color-1);
}
.tab-cancel{
  flex: 1;
  text-align: end;
  padding-right: 30px
}
.input-content-container{
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  box-sizing: border-box;
  background-color: var(--log-out-mobile);
  z-index: 9999;
  .input-content {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    color: #676c80;
    background: var(--background-color-1);
    border: none;
    box-sizing: border-box;
    font-family: "PingFang SC";
    font-style: normal;
    font-weight: 450;
    font-size: 16px;
    line-height: 4vh;
    resize: none;
    padding: 10px;
    position: absolute;
    bottom: 0;
  }
  .input{
    width: 100%;
  }
  .content-bottom-input {
    color: #676c80;
    width: 100%;
    height: 35px;
    border: none;
    box-sizing: border-box;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 450;
    font-size: 16px;
    line-height: 4vh;
    background-color: var(--chat-editor-input-color-h5);
    caret-color: var(--caret-color);
    border-radius: 45px;
    resize: none;
    padding-left: 12px;
  }
}
</style>
