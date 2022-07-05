<template>
  <div class="manage-member-container">
    <div class="global-setting">
      <div class="setting-item">
        <div class="item-left-section">
          <svg-icon
            class="setting-icon" :icon-name="ICON_NAME.MicOn" size="large"
          />
          <span class="setting-name">禁言所有人</span>
        </div>
        <div class="item-right-section">
          <el-switch :value="basicStore.isMuteAllAudio" @change="toggleAllAudio" />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left-section">
          <svg-icon
            class="setting-icon" :icon-name="ICON_NAME.CameraOn" size="large"
          />
          <span class="setting-name">禁画所有人</span>
        </div>
        <div class="item-right-section">
          <el-switch :value="basicStore.isMuteAllVideo" @change="toggleAllVideo" />
        </div>
      </div>
    </div>
    <div class="divide-line"></div>
    <div class="member-list-container">
      <div class="member-list-header">成员列表<span class="member-count">({{ streamNumber }}人)</span></div>
      <div :class="['member-list-content', isOperatePopoverShow ? 'show-operate-popover' : '']">
        <div
          v-for="(stream) in streamList"
          :key="stream.userId"
          :class="[
            'member-item',
            isOperatePopoverShow && operateUserId === stream.userId ? 'pop-show': '',
            basicStore.role === ETUIRoomRole.MASTER && basicStore.userId === stream.userId ? 'is-host': ''
          ]"
        >
          <div class="member-left-section">
            <img class="user-avatar" :src="stream.userAvatar || defaultAvatar">
            <div class="user-name">{{ stream.userName || stream.userId }}</div>
            <div
              v-if="basicStore.role === ETUIRoomRole.MASTER && basicStore.userId === stream.userId"
              class="user-extra-info"
            >
              主持人, 我
            </div>
            <div v-else-if="basicStore.userId === stream.userId" class="user-extra-info">
              我
            </div>
            <div v-else-if="basicStore.masterUserId === stream.userId" class="user-extra-info">
              主持人
            </div>
          </div>
          <div class="member-right-section">
            <svg-icon
              class="setting-icon"
              :icon-name="stream.isAudioStreamAvailable ? ICON_NAME.MicOn : ICON_NAME.MicOff"
              size="large"
            />
            <svg-icon
              class="setting-icon video-icon"
              :icon-name="stream.isVideoStreamAvailable ? ICON_NAME.CameraOn : ICON_NAME.CameraOff "
              size="large"
            />
          </div>
          <div class="member-right-hover-section">
            <div
              class="mute-btn"
              @click="muteUserAudio(stream.userId, !stream.isAudioMutedByMaster)"
            >
              {{ stream.isAudioMutedByMaster ? '解除禁言' : '禁言' }}
            </div>
            <el-popover
              placement="bottom" :width="124" trigger="click"
              :show-arrow="false"
              @show="triggerOperationPopoverShow"
              @hide="triggerOperationPopoverHide"
            >
              <template #reference>
                <div class="more-btn" @click="clickOperateMore(stream.userId)">
                  更多
                  <svg-icon class="more-icon" :icon-name="ICON_NAME.ArrowBorderDown"></svg-icon>
                </div>
              </template>
              <template #default>
                <div class="user-operate-list">
                  <div
                    class="user-operate-item"
                    @click="muteUserVideo(stream.userId, !stream.isVideoMutedByMaster)"
                  >
                    {{ stream.isVideoMutedByMaster ? '解除禁画' : '禁画' }}
                  </div>
                  <div
                    class="user-operate-item"
                    @click="muteUserChat(stream.userId, !stream.isChatMutedByMaster)"
                  >
                    {{ stream.isChatMutedByMaster ? '允许文字聊天' : '禁止文字聊天' }}
                  </div>
                  <div
                    class="user-operate-item"
                    @click="kickOffUser(stream.userId)"
                  >
                    踢出房间
                  </div>
                </div>
              </template>
            </el-popover>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIRoomCore, { ETUIRoomRole } from '../../tui-room-core';
import SvgIcon from '../common/SvgIcon.vue';
import { useStreamStore, StreamInfo } from '../../stores/stream';
import { useBasicStore } from '../../stores/basic';
import { ICON_NAME } from '../../constants/icon';
import defaultAvatar from '../../assets/imgs/avatar.png';

const isOperatePopoverShow = ref(false);
const operateUserId = ref('');

const basicStore = useBasicStore();
const streamStore = useStreamStore();

const { streamList, streamNumber } = storeToRefs(streamStore);

watch(streamList, (val, oldVal) => {
  if (!oldVal) {
    return;
  }
  const oldStreamIdList = (oldVal as StreamInfo[]).map(stream => stream.userId);
  const newStreamIdList = val.map(stream => stream.userId);
  if (oldStreamIdList.length !== newStreamIdList.length) {
    const removeUserIdList = oldStreamIdList.filter(userId => newStreamIdList.indexOf(userId) === -1);
    if (operateUserId.value && removeUserIdList.indexOf(operateUserId.value) > -1) {
      // 踢人后, 需要关闭当前的 popover 展示
      triggerOperationPopoverHide();
    }
  }
}, { immediate: true });

function triggerOperationPopoverShow() {
  isOperatePopoverShow.value = true;
}

function triggerOperationPopoverHide() {
  isOperatePopoverShow.value = false;
  operateUserId.value = '';
}

function clickOperateMore(userId: string | undefined) {
  if (!userId) {
    return;
  }
  operateUserId.value = userId;
}

async function toggleAllAudio() {
  const newIsMuteAllAudio = !basicStore.isMuteAllAudio;
  basicStore.setIsMuteAllAudio(newIsMuteAllAudio);
  streamStore.setMuteAllAudio(newIsMuteAllAudio);
  await TUIRoomCore.muteAllUsersMicrophone(newIsMuteAllAudio);
}

async function toggleAllVideo() {
  const newIsMuteAllVideo = !basicStore.isMuteAllVideo;
  basicStore.setIsMuteAllVideo(newIsMuteAllVideo);
  streamStore.setMuteAllVideo(newIsMuteAllVideo);
  await TUIRoomCore.muteAllUsersCamera(newIsMuteAllVideo);
}

function muteUserAudio(userId: string | undefined, mute: boolean) {
  if (!userId) {
    return;
  }
  streamStore.setMuteUserAudio(userId, mute);
  TUIRoomCore.muteUserMicrophone(userId, mute);
}

function muteUserVideo(userId: string | undefined, mute: boolean) {
  if (!userId) {
    return;
  }
  streamStore.setMuteUserVideo(userId, mute);
  TUIRoomCore.muteUserCamera(userId, mute);
}

function muteUserChat(userId: string | undefined, mute: boolean) {
  if (!userId) {
    return;
  }
  streamStore.setMuteUserChat(userId, mute);
  TUIRoomCore.muteUserChatRoom(userId, mute);
}

function kickOffUser(userId: string | undefined) {
  if (!userId) {
    return;
  }
  TUIRoomCore.kickOffUser(userId);
}

</script>

<style lang="scss">
  .manage-member-container {
    position: relative;
    height: 100%;
    .setting-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 32px;
      .setting-icon {
        width: 32px;
        height: 32px;
      }
      .item-left-section {
        display: flex;
        align-items: center;

        .setting-name {
          font-size: 14px;
          margin-left: 8px;
          color: #CFD4E6;
        }
      }
    }
    .divide-line {
      height: 1px;
      width: 100%;
      background: #0D0F15;
      box-shadow: 0 -1px 0 0 #2E323D;
    }
    .member-list-container {
      position: absolute;
      left: 0;
      right: 0;
      top: 110px;
      bottom: 84px;
      overflow-y: scroll;
      padding: 10px 0;
      .member-count {
        margin-left: 5px;
      }
      &::-webkit-scrollbar {
        display: none;
      }
      .member-list-header {
        padding: 0 32px;
        font-weight: 500;
        font-size: 14px;
        color: #7C85A6;
        line-height: 24px;
      }
      .member-list-content {
        &.show-operate-popover {
          .member-item {
            &:hover {
              .member-right-hover-section {
                display: none;
              }
              .member-right-section {
                display: block;
              }
            }
            &.pop-show {
              .member-right-hover-section {
                display: flex;
              }
              .member-right-section {
                display: none;
              }
            }
          }
        }
        margin-top: 15px;
        .member-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          height: 69px;
          justify-content: space-between;
          padding: 0 32px;
          .member-right-section {
            .video-icon {
              margin-left: 5px;
            }
          }
          &.is-host:hover {
            .member-right-hover-section {
              display: none;
            }
            .member-right-section {
              display: block;
            }
          }
          .member-right-hover-section {
            display: none;
          }
          &:hover {
            cursor: pointer;
            background: rgba(46,50,61,0.70);
          }
          &.pop-show, &:hover {
            .member-right-hover-section {
              display: flex;
              flex-direction: row;
              .more-btn, .mute-btn {
                height: 32px;
                border-radius: 2px;
                font-size: 14px;
                color: #FFFFFF;
                line-height: 32px;
                padding: 0 20px;
              }
              .mute-btn {
                background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
              }
              .more-btn {
                display: flex;
                flex-direction: row;
                align-items: center;
                background: rgba(173,182,204,0.10);
                border: 1px solid #ADB6CC;
                margin-left: 12px;
                .more-icon {
                  margin-left: 4px;
                  width: 20px;
                  height: 20px;
                }
              }
            }
            .member-right-section {
              display: none;
            }
          }
          .member-left-section {
            display: flex;
            flex-direction: row;
            align-items: center;
            .user-avatar {
              width: 48px;
              height: 48px;
              border-radius: 50%;
            }
            .user-name {
              margin-left: 9px;
              font-size: 14px;
              color: #7C85A6;
              line-height: 22px;
              max-width: 180px;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
            }
            .user-extra-info {
              line-height: 18px;
              font-size: 12px;
              margin-left: 13px;
              padding: 2px;
              color: #4D70FF;
              background: #2E323D;
              border-radius: 8px;
              padding: 0 6px;
            }
          }
        }
      }
    }
  }
  .user-operate-list {
    text-align: center;
    background: #1D2029;
    box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
    border: none;
    .user-operate-item {
      &:hover {
        cursor: pointer;
      }
      text-align: center;
      font-size: 14px;
      color: #CFD4E6;;
      height: 40px;
      line-height: 40px;
    }
  }
</style>
