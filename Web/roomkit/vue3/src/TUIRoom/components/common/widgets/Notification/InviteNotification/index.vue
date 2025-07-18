<template>
  <div v-show="visible" :class="['tui-notification', customClass]">
    <div class="tui-notification-container" :style="overlayContainerStyle">
      <div class="tui-notification-message">
        <div class="invitation-notification-inviter-container">
          <div class="invitation-notification-inviter">
            <Avatar class="avatar" :img-src="message.avatarUrl" />
            <span class="invitation-notification-title">{{
              t('sb invites you to join the conference', {
                name: message.userName || message.userId,
              })
            }}</span>
          </div>
          <span class="invitation-notification-room-name">{{
            message.roomName
          }}</span>
          <div class="invitation-notification-room-info-container">
            <div class="invitation-notification-room-text-container">
              <span class="invitation-notification-room-text">
                {{ t('Host') }}:
              </span>
              <span class="invitation-notification-room-text">
                {{ message.roomOwner }}
              </span>
            </div>
            <i class="invitation-notification-room-text-split"></i>
            <div>
              <span class="invitation-notification-room-text">
                {{ t('Attendees') }}:
              </span>
              <span class="invitation-notification-room-text">
                {{ `${message.roomMemberCount} ${t('people')}` }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <i class="invitation-notification-bottom-split"></i>
      <div class="invitation-notification-bottom-container">
        <span class="invitation-notification-bottom" @click="handleCancel">
          {{ cancelButtonText }}
        </span>
        <TUIButton type="primary" @click="handleConfirm">
          <IconEnterRoom class="icon" />
          <span class="button-text">{{ confirmButtonText }}</span>
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, withDefaults, defineProps } from 'vue';
import {
  TUIButton,
  IconEnterRoom,
} from '@tencentcloud/uikit-base-component-vue3';
import useZIndex from '../../../../../hooks/useZIndex';
import { useI18n } from '../../../../../locales';
import Avatar from '../../../Avatar.vue';
import { invitationInfo } from './index';

const { t } = useI18n();

const visible = ref(false);
const overlayContainerStyle = ref({});
const { nextZIndex } = useZIndex();
type BeforeCloseFn = () => void;

interface Props {
  appendTo: string;
  customClass?: string;
  message: invitationInfo;
  onConfirm?: BeforeCloseFn | null;
  onCancel?: BeforeCloseFn | null;
  close?: BeforeCloseFn | null;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  appendTo: '',
  customClass: '',
  message: {
    userId: '',
    userName: '',
    avatarUrl: '',
    roomName: '',
    roomMemberCount: 0,
    roomOwner: '',
    roomId: '',
  },
  confirmButtonText: '',
  cancelButtonText: '',
  onConfirm: null,
  onCancel: null,
  close: null,
});

watch(visible, val => {
  if (val) {
    overlayContainerStyle.value = { zIndex: nextZIndex() };
  }
});

function onOpen() {
  visible.value = true;
}

const handleConfirm = () => {
  handleAction(props.onConfirm);
};

const handleCancel = () => {
  handleAction(props.onCancel);
};

const handleAction = (fn: BeforeCloseFn | null) => {
  if (fn) {
    fn();
  }
  if (props.close) {
    props.close();
  }
};

onMounted(() => {
  onOpen();
});
</script>

<style lang="scss" scoped>
.tui-notification {
  .tui-notification-container {
    position: fixed;
    top: 7%;
    right: 1%;
    display: flex;
    flex-direction: column;
    padding: 20px 30px 10px 20px;
    background-color: var(--uikit-color-white-1);
    border: 1px solid var(--uikit-color-black-8);
    border-radius: 15px;

    .tui-notification-message {
      position: relative;
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--text-color-primary);
    }
  }

  .invitation-notification-inviter {
    display: flex;
    align-items: center;

    .invitation-notification-title {
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      color: var(--text-color-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .avatar {
      width: 30px;
      height: 30px;
      margin-right: 5px;
    }
  }

  .invitation-notification-room-info-container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .invitation-notification-room-text {
      max-width: 20px;
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      color: var(--uikit-color-gray-5);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .invitation-notification-room-text-split {
    display: block;
    width: 1px;
    height: 14px;
    background-color: var(--uikit-color-black-8);
  }

  .icon {
    display: flex;
    align-items: center;
  }

  .invitation-notification-room-name {
    display: block;
    max-width: 300px;
    padding: 5px 0;
    overflow: hidden;
    font-size: 20px;
    font-weight: 500;
    color: var(--uikit-color-gray-3);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .button-text {
    padding-left: 5px;
  }

  .invitation-notification-bottom-split {
    display: block;
    width: 100%;
    height: 1px;
    margin-top: 15px;
    background-color: var(--uikit-color-black-8);
  }

  .invitation-notification-bottom-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;

    .invitation-notification-bottom {
      font-size: 14px;
      font-weight: 500;
      color: var(--uikit-color-gray-7);
      cursor: pointer;
    }

    .icon {
      display: flex;
      align-items: center;
      width: 16px;
      height: 16px;
    }
  }
}
</style>
