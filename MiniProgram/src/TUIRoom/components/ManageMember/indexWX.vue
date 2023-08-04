<template>
  <div class="manage-member-container">
    <div v-if="applyToAnchorList.length > 0" class="apply-on-stage-info">
      <div class="apply-info">
        {{ `${applyToAnchorList[0].userName || applyToAnchorList[0].userId} ${t('Applying for the stage')}` }}
      </div>
    </div>
    <div class="member-list-container">
      <div class="member-list-header">
        {{ t('Member List') }}
        <span class="member-count">({{ userNumber }}{{ t('members') }})</span>
      </div>
      <div class="member-list-content">
        <member-item v-for="(userInfo) in userList" :key="userInfo.userId" :user-info="userInfo"></member-item>
      </div>
    </div>
    <div class="manage-member-bottom">
      <div
        class="manage-member-button"
        :class="roomStore.isMicrophoneDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageMember(ManageControlType.AUDIO)"
      >
        {{ audioManageInfo }}
      </div>
      <div
        class="manage-member-button"
        :class="roomStore.isCameraDisableForAllUser ? 'lift-all' : ''"
        @touchstart="toggleManageMember(ManageControlType.VIDEO)"
      >
        {{ videoManageInfo }}
      </div>
    </div>
    <div v-if="showManageAllUserDialog" class="popup-dialog-audio">
      <div class="popup-dialog-audio-title">
        {{ dialogTitleInfo }}
      </div>
      <div class="popup-button">
        <span class="popup-button-cancel" @touchstart="showManageAllUserDialog = false">{{ t('Cancel') }}</span>
        <span class="popup-button-mute" @touchstart="doToggleManageMember">{{ dialogActionInfo }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { Ref, ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import MemberItem from '../ManageMember/MemberItem/indexWX.vue';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useRoomStore } from '../../stores/room';
import { useI18n } from '../../locales';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-wx';

const roomEngine = useGetRoomEngine();
const { t } = useI18n();
const roomStore = useRoomStore();
const {
  userList,
  userNumber,
  applyToAnchorList,
  isMicrophoneDisableForAllUser,
  isCameraDisableForAllUser,
} = storeToRefs(roomStore);

const audioManageInfo = computed(() => (roomStore.isMicrophoneDisableForAllUser ? t('Lift all mute') : t('All mute')));
const videoManageInfo = computed(() => (roomStore.isCameraDisableForAllUser ? t('Lift stop all video') : t('All stop video')));

const showManageAllUserDialog: Ref<boolean> = ref(false);
const dialogTitleInfo: Ref<string> = ref('');
const dialogActionInfo: Ref<string> = ref('');

  enum ManageControlType {
    AUDIO = 'audio',
    VIDEO = 'video',
    Message = 'message',
  }
const currentControlType: Ref<ManageControlType> = ref(ManageControlType.AUDIO);

async function toggleManageMember(type: ManageControlType) {
  showManageAllUserDialog.value = true;
  currentControlType.value = type;
  switch (type) {
    case ManageControlType.AUDIO:
      dialogTitleInfo.value = roomStore.isMicrophoneDisableForAllUser
        ? t('Can you lift all mute')
        : t('All current and new members will be muted.');
      dialogActionInfo.value = audioManageInfo.value;
      break;
    case ManageControlType.VIDEO:
      dialogTitleInfo.value = roomStore.isCameraDisableForAllUser
        ? t('Should we turn on the video for everyone')
        : t('All current and new members will turn off their videos.');
      dialogActionInfo.value = videoManageInfo.value;
      break;
    default:
      break;
  }
}

async function doToggleManageMember() {
  switch (currentControlType.value) {
    case ManageControlType.AUDIO:
      await roomEngine.instance?.disableDeviceForAllUserByAdmin({
        isDisable: !isMicrophoneDisableForAllUser.value,
        device: TUIMediaDevice.kMicrophone,
      });
      roomStore.setMicrophoneDisableState(!isMicrophoneDisableForAllUser.value);
      break;
    case ManageControlType.VIDEO:
      await roomEngine.instance?.disableDeviceForAllUserByAdmin({
        isDisable: !isCameraDisableForAllUser.value,
        device: TUIMediaDevice.kCamera,
      });
      roomStore.setCameraDisableState(!isCameraDisableForAllUser.value);
      break;
    default:
      break;
  }
  showManageAllUserDialog.value = false;
}
</script>

  <style lang="scss" scoped>
    .manage-member-container {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      .apply-on-stage-info {
        width: 100%;
        height: 6vh;
        background-image: linear-gradient(235deg, #1883FF 0%, #0062F5 100%);
        padding: 9px 20px 10px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 10px 0 10px 0 ;
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
      .searching-container {
        input[type=text]{
          background-image: url(../../assets/icons/svg/search.svg);
          background-repeat: no-repeat;
          background-position: 10px center;
          padding-left: 35px;
        }
        .searching-input {
          width: 93%;
          background: #292D38;
          border-radius: 8px;
          height: 34px;
          border-style: none;
          margin-left: 16px;
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 450;
          font-size: 16px;
          line-height: 18px;
          color: #676c80;
          caret-color: var(--caret-color);
          ::placeholder {
            font-family: 'PingFang SC';
            font-style: normal;
            font-weight: 400;
            font-size: 16px;
            line-height: 18px;
            color: #676c80;
          }
          &:focus-visible {
           outline: none;
         }
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
            color: var(--setting-name-color);
          }
        }
      }
      .divide-line {
        height: 1px;
        width: 100%;
        background: var(--divide-line-color);
        box-shadow: 0 -1px 0 0 var(--divide-line);
      }
      .member-list-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        .member-count {
          margin-left: 5px;
        }
        &::-webkit-scrollbar {
          display: none;
        }
        .member-list-header {
          padding: 0 32px;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: var(--input-font-color);
          line-height: 24px;
        }
        .member-list-content {
          flex: 1;
          overflow-y: scroll;
        }
      }
      .manage-member-bottom {
        width: 100%;
        display: flex;
        justify-content: space-around;
        z-index: 1;
        .manage-member-button {
          border-radius: 10px;
          padding: 13px 24px;
          background-color: var(--manage-member-button-h5);
          font-weight: 400;
          color: var(--mute-button-color-h5);
        }
        .lift-all {
          color: #FF2E2E;
        }
      }
      .popup-dialog-audio,.popup-dialog-video {
        width: 64vw;
        background: var(--popup-mute-background-color-h5);
        border-radius: 8px;
        position: absolute;
        bottom: 46vh;
        left: 18vw;
        white-space: nowrap;
        .popup-dialog-audio-title {
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 22px;
          text-align: center;
          color: #2B2E38;
          white-space: normal;
          padding: 20px;
        }
        .popup-button{
          display: flex;
          justify-content: space-evenly;
          padding: 10px;
          .popup-button-cancel{
            padding: 4px 16px;
            background-color: #fff;
            color: #646366;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
          }
          .popup-button-mute{
            padding: 4px 16px;
            background-color: #006eff;
            color: #fff;
            border: 1px solid #dcdfe6;
            border-radius: 4px;
          }
        }
      }
    }
  </style>

