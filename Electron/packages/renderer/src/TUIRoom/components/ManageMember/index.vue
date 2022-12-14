<template>
  <div class="manage-member-container">
    <div v-if="applyToAnchorList.length > 0" class="apply-on-stage-info">
      <div class="apply-info">
        {{ `${applyToAnchorList[0].userName || applyToAnchorList[0].userId} ${t('Applying for the stage')}` }}
      </div>
      <div class="button" @click="showApplyUserLit">{{ t('Check') }}</div>
    </div>
    <div class="global-setting">
      <div class="setting-item">
        <div class="item-left-section">
          <svg-icon
            class="setting-icon" :icon-name="ICON_NAME.MicOn" size="large"
          />
          <span class="setting-name">{{ t('Disable all audios') }}</span>
        </div>
        <div class="item-right-section">
          <el-switch :value="!roomStore.enableAudio" @change="toggleAllAudio" />
        </div>
      </div>
      <div class="setting-item">
        <div class="item-left-section">
          <svg-icon
            class="setting-icon" :icon-name="ICON_NAME.CameraOn" size="large"
          />
          <span class="setting-name">{{ t('Disable all videos') }}</span>
        </div>
        <div class="item-right-section">
          <el-switch :value="!roomStore.enableVideo" @change="toggleAllVideo" />
        </div>
      </div>
    </div>
    <div class="divide-line"></div>
    <div class="member-list-container">
      <div class="member-list-header">
        {{ t('Member List') }}
        <span class="member-count">({{ userNumber }}{{ t('members') }})</span>
      </div>
      <div class="member-list-content">
        <member-item v-for="(userInfo) in userList" :key="userInfo.userId" :user-info="userInfo"></member-item>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { storeToRefs } from 'pinia';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import SvgIcon from '../common/SvgIcon.vue';
import { useRoomStore } from '../../stores/room';
import { useBasicStore } from '../../stores/basic';
import { ICON_NAME } from '../../constants/icon';
import MemberItem from './MemberItem/index.vue';
import { useI18n } from 'vue-i18n';

const roomEngine = useGetRoomEngine();

const { t } = useI18n();

const basicStore = useBasicStore();
const roomStore = useRoomStore();

const { userList, userNumber, applyToAnchorList } = storeToRefs(roomStore);

function showApplyUserLit() {
  basicStore.setShowApplyUserList(true);
}

async function toggleAllAudio() {
  const newEnableAudio = !roomStore.enableAudio;
  await roomEngine.instance?.updateRoomInfo({
    enableAudio: newEnableAudio,
  });
  roomStore.setEnableAudio(newEnableAudio);
}

async function toggleAllVideo() {
  const newEnableVideo = !roomStore.enableVideo;
  await roomEngine.instance?.updateRoomInfo({
    enableVideo: newEnableVideo,
  });
  roomStore.setEnableVideo(newEnableVideo);
}
</script>

<style lang="scss">
  .manage-member-container {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    .apply-on-stage-info {
      width: 100%;
      height: 60px;
      background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
      padding: 0 20px 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .apply-info {
        font-weight: 400;
        font-size: 14px;
        color: #FFFFFF;
      }
      .button {
        width: 82px;
        height: 32px;
        background: rgba(255,255,255,0.10);
        border: 1px solid #FFFFFF;
        border-radius: 2px;
        text-align: center;
        line-height: 32px;
        font-weight: 400;
        font-size: 14px;
        color: #FFFFFF;
        cursor: pointer;
      }
    }
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
      overflow-y: scroll;
      padding: 10px 0;
      flex: 1;
      display: flex;
      flex-direction: column;
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
        margin-top: 15px;
        flex: 1;
        overflow-y: scroll;
      }
    }
  }
</style>
