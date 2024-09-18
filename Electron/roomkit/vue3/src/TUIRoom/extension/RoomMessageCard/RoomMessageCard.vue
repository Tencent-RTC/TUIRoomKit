<template>
  <div
    v-if="roomCardData.isRoomMessage"
    :class="[
      'room-message-container',
      roomCardData.isMessageFromMe ? 'isMe' : 'notMe',
    ]"
  >
    <div :class="['room-message-card-container', roomCardData.roomState]">
      <div class="content">
        <div :class="['content-title', contentTitleClass]">
          <span class="icon"></span>
          <p v-if="RoomState.CREATED === roomCardData.roomState">
            {{ t('Meeting in progress') }}
          </p>
          <p v-else>{{ t('Meeting') }}</p>
        </div>
        <div class="content-desc">
          <div class="title">
            {{
              `${roomCardData.ownerName || roomCardData.owner}${t('Quick Conference')}`
            }}
          </div>
          <ul class="users">
            <template v-for="(user, index) in roomCardData.userList">
              <li v-if="index <= 4" :key="user.userId">
                <img
                  :src="user.faceUrl || defaultAvatarUrl"
                  :alt="user.nickName || user.userId"
                  :onerror="avatarLoadError"
                />
              </li>
              <li v-if="index === 5" class="more" :key="user.userId">...</li>
            </template>
          </ul>
        </div>
      </div>
      <div
        :class="['footer', footerClass, roomCardData.isInnerRoom && 'in-room']"
      >
        <span v-if="roomInfo.visible" class="room-info">{{
          roomInfo.message
        }}</span>
        <span
          v-if="roomStatus.visible"
          :class="['room-status']"
          @click="enterRoom"
          >{{ roomStatus.message }}
        </span>
        <span v-if="roomDestroy.visible" :class="['room-info', 'center']">{{
          roomDestroy.message
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, watchEffect, ref } from 'vue';
import { chatExtension, RoomState, MessageData } from '../chatExtension';
import { HandleRoomMessage } from './handleRoomMessage';
import { Message, Profile } from '@tencentcloud/chat';
import { useI18n } from '../../locales/index';
const { t } = useI18n();
const props = defineProps<{
  message: Message;
}>();
const roomCardData = ref<MessageData>({
  roomId: '',
  isRoomMessage: false,
  isRoomCreateByMe: false,
  isMessageFromMe: false,
  roomState: RoomState.CREATING,
  userList: [],
  isInnerRoom: false,
  myProfile: {} as Profile,
  ownerName: '',
  owner: '',
});
const roomMessageCard = new HandleRoomMessage();
watchEffect(() => {
  roomMessageCard.initialize(props.message);
  const {
    isRoomMessage,
    isRoomCreateByMe,
    roomState,
    userList,
    roomId,
    isInnerRoom,
    myProfile,
    isMessageFromMe,
    ownerName,
    owner,
  } = roomMessageCard.messageData;
  roomCardData.value = {
    roomId,
    isRoomMessage,
    isRoomCreateByMe,
    isMessageFromMe,
    roomState,
    userList,
    isInnerRoom,
    myProfile,
    ownerName,
    owner,
  };
});
const avatarLoadError = (e: any) => {
  e.target.src = defaultAvatarUrl;
};
const contentTitleClass = computed(() => {
  const stateMap = {
    [RoomState.CREATED]: 'success',
    [RoomState.CREATING]: 'primary',
    [RoomState.DESTROYING]: 'default',
    [RoomState.DESTROYED]: 'default',
  };
  return stateMap[roomCardData.value.roomState];
});
const footerClass = computed(() => {
  const stateMap = {
    [RoomState.CREATED]: 'default',
    [RoomState.CREATING]: 'center',
    [RoomState.DESTROYING]: 'center',
    [RoomState.DESTROYED]: 'center',
  };
  return stateMap[roomCardData.value.roomState];
});
const roomInfo = computed(() => {
  if (roomCardData.value.roomState === RoomState.CREATING) {
    return {
      visible: true,
      message: `${t('Initiating')}...`,
    };
  }
  if (
    roomCardData.value.isRoomCreateByMe &&
    roomCardData.value.roomState === RoomState.CREATED
  ) {
    return {
      visible: true,
      message:
        roomCardData.value.userList.length > 1
          ? t('X people have joined', {
              number: roomCardData.value.userList.length - 1,
            })
          : t('Waiting for members to join the meeting'),
    };
  }
  if (
    !roomCardData.value.isRoomCreateByMe &&
    roomCardData.value.roomState === RoomState.CREATED
  ) {
    return {
      visible: true,
      message: t('X people are in the meeting', {
        number: roomCardData.value.userList.length,
      }),
    };
  }
  return {
    visible: false,
    message: '',
  };
});
const roomStatus = computed(() => {
  if (roomCardData.value.roomState === RoomState.CREATED) {
    return {
      visible: true,
      message: roomCardData.value.isInnerRoom
        ? t('Already joined')
        : t('Enter the meeting'),
    };
  }
  return {
    visible: false,
    message: '',
  };
});
const roomDestroy = computed(() => {
  if (roomCardData.value.roomState === RoomState.DESTROYING) {
    return {
      visible: true,
      message: `${t('Ending meeting')}...`,
    };
  }
  if (roomCardData.value.roomState === RoomState.DESTROYED) {
    return {
      visible: true,
      message: t('The meeting has ended'),
    };
  }
  return {
    visible: false,
    message: '',
  };
});
const defaultAvatarUrl =
  'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png';
const enterRoom = () => {
  chatExtension.enterRoom(roomCardData.value.roomId, props.message);
};
</script>

<style lang="scss" scoped>
@import './roomMessageCard.scss';
</style>
