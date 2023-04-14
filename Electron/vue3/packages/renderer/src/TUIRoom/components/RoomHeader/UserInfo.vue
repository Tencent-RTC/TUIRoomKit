<template>
  <div ref="userInfoRef" class="user-info-container">
    <div class="user-info-content" @click="handleUserControl">
      <img class="avatar" :src="avatarUrl || defaultAvatar">
      <div class="name">{{ userName || userId }}</div>
      <svg-icon class="down-icon" :icon-name="iconName" size="medium"></svg-icon>
    </div>

    <div v-if="showUserControl" class="user-control-container">
      <div v-show="showEditNameItem">
        <div class="user-control-item-head" @click="showEditUserNameDialog">{{ t('Edit profile') }}</div>
      </div>
      <div class="user-control-item-foot" @click="$emit('log-out')">{{ t('Log out') }}</div>
    </div>
    <Dialog
      :title="t('Edit profile')"
      width="420px"
      :model-value="showUserNameEdit"
      class="custom-element-class"
      :modal="true"
      :append-to-body="false"
      :close-on-click-modal="true"
      @close="closeEditUserNameDialog"
    >
      <div class="dialog-content">
        <span class="title">{{ t('User Name') }}</span>
        <div class="input-container">
          <el-input
            v-model="tempUserName"
            type="text"
            maxlength="80"
            :placeholder="t('Please input user name')"
          ></el-input>
        </div>
      </div>
      <div class="dialog-footer">
        <el-button @click="closeEditUserNameDialog">{{ t('Cancel') }}</el-button>
        <el-button type="primary" @click="handleSaveUserName(tempUserName)">{{ t('Save') }}</el-button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, Ref } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import defaultAvatar from '../../assets/imgs/avatar.png';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { ElMessage } from '../../elementComp';
import { MESSAGE_DURATION } from '../../constants/message';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-electron';
import { useRoomStore } from '../../stores/room';
import { isInnerScene } from '../../utils/constants';
import Dialog from '../../elementComp/Dialog.vue';

interface Props {
  userId: string,
  userName: string,
  avatarUrl?: string,
}
defineProps<Props>();
defineEmits(['log-out']);

const { t } = useI18n();
const basicStore = useBasicStore();
const { userName } = storeToRefs(basicStore);

const userInfoRef = ref();
const showUserControl = ref(false);
const showUserNameEdit: Ref<boolean> = ref(false);

const showEditNameItem: Ref<boolean> = ref(isInnerScene);

const tempUserName = ref('');
const roomStore = useRoomStore();

const iconName = computed(() => (showUserControl.value ? ICON_NAME.LineArrowUp : ICON_NAME.LineArrowDown));

/**
 * Whether to display the user information operation box
 *
 * 是否显示用户信息操作框
**/
function handleUserControl() {
  showUserControl.value = !showUserControl.value;
}

/**
 * Hide the user information action box
 *
 * 隐藏用户信息操作框
**/
function hideUserControl(event: Event) {
  if (!userInfoRef.value.contains(event.target)) {
    showUserControl.value = false;
  }
}

/**
 * Show change name dialog
 *
 * 展示修改名字 dialog
**/
function showEditUserNameDialog() {
  showUserNameEdit.value = true;
  tempUserName.value = userName.value;
}

/**
 * Close the modify name dialog
 *
 * 关闭修改名字的 dialog
**/
function closeEditUserNameDialog() {
  showUserNameEdit.value = false;
}

/**
 * Save the new userName
 *
 * 保存新的 userName
**/
async function handleSaveUserName(userName: string) {
  if (userName.length === 0) {
    ElMessage({
      type: 'warning',
      message: t('Username length should be greater than 0'),
      duration: MESSAGE_DURATION.NORMAL,
    });
    return;
  }
  basicStore.setUserName(userName);
  TUIRoomEngine.setSelfInfo({ userName, avatarUrl: roomStore.localUser.avatarUrl || '' });
  roomStore.setLocalUser({ userName });
  closeEditUserNameDialog();
}

onMounted(() => {
  window.addEventListener('click', hideUserControl);
});

onUnmounted(() => {
  window.removeEventListener('click', hideUserControl);
});
</script>

<style lang="scss">
@import '../../assets/style/var.scss';
@import '../../assets/style/element-custom.scss';

.dialog-content {
  padding: 0 10px;
  text-align: left;
  .title {
    font-weight: bold;
    font-size: 16px;
    display: inline-block;
    margin-bottom: 14px;
  }
  .input-container {
    position: relative;
    margin-bottom: 30px;
  }
}
.dialog-footer {
  width: 100%;
  height: 100%;
  text-align: center;
}
.user-info-container {
  position: relative;
  .user-info-content {
    display: flex;
    align-items: center;
    cursor: pointer;
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }
    .name {
      max-width: 100px;
      margin-left: 20px;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-font);
    }
    .down-icon {
      margin-left: 4px;
    }
  }
  .user-control-container {
    background: var(--user-control-container-color-bg);
    box-shadow: var(--user-control-container-shadow);
    color: var(--color-font);
    padding: 10px 0;
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    border-radius: 4px;
    .user-control-item-foot,.user-control-item-head{
      width: 104px;
      text-align: center;
      font-size: 14px;
      cursor: pointer;
      height: 20px;
    }
  }
}
</style>
