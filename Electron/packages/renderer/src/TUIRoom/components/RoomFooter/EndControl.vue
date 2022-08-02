<template>
  <div class="end-button" tabindex="1" @click="stopMeeting">结束会议</div>
  <el-dialog
    :model-value="visible"
    custom-class="custom-element-class"
    :title="title"
    :modal="true"
    :append-to-body="true"
    width="420px"
    :before-close="cancel"
  >
    <div v-if="currentDialogType === DialogType.BasicDialog">
      <span v-if="basicInfo.role === ETUIRoomRole.MASTER">您当前是房间主持人，请选择相应操作。若选择“离开房间”，则房间不会解散，您需要指定新主持人。</span>
      <span v-else>确定离开房间吗？</span>
    </div>
    <div v-if="currentDialogType === DialogType.TransferDialog">
      <div>选择主持人</div>
      <div>
        <el-select v-model="selectedUser">
          <el-option
            v-for="user in remoteAnchorList"
            :key="user.userId"
            :value="user.userId"
            :label="user.userName"
          />
        </el-select>
      </div>
    </div>
    <template #footer>
      <div v-if="currentDialogType === DialogType.BasicDialog">
        <el-button v-if="basicInfo.role === ETUIRoomRole.MASTER" type="primary" @click="dismissRoom">解散房间</el-button>
        <el-button v-if="showLeaveRoom" type="primary" @click="leaveRoom">离开房间</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
      <div v-if="currentDialogType === DialogType.TransferDialog">
        <el-button type="primary" @click="transferAndLeave">移交并离开</el-button>
        <el-button @click="cancel">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import TUIRoomCore, { ETUIRoomRole, ETUIRoomEvents } from '../../tui-room-core';
import logger from '../../tui-room-core/common/logger';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { computed } from '@vue/reactivity';
import { storeToRefs } from 'pinia';

const logPrefix = '[EndControl]';

enum DialogType {
  BasicDialog,
  TransferDialog
}
const currentDialogType = ref(DialogType.BasicDialog);

const emit = defineEmits(['onRoomExit', 'onRoomDestroy']);

const visible: Ref<boolean> = ref(false);
const basicInfo = useBasicStore();
logger.log(`${logPrefix} basicInfo:`, basicInfo);

const roomStore = useRoomStore();
const { remoteAnchorList } = storeToRefs(roomStore);

const title = computed(() => (currentDialogType.value === DialogType.BasicDialog ? '是否要离开房间' : '请选择新的房间主持人'));

const showLeaveRoom = computed(() => (
  basicInfo.role ===  ETUIRoomRole.MASTER && remoteAnchorList.value.length > 0)
  || basicInfo.role !== ETUIRoomRole.MASTER);

const selectedUser: Ref<string> = ref('');
const roomMember = ref(TUIRoomCore.getRoomUsers());

function resetState() {
  visible.value = false;
  currentDialogType.value = DialogType.BasicDialog;
}

function stopMeeting() {
  if (!visible.value) {
    visible.value = true;
  }
  // 获取房间里最新成员
  roomMember.value = TUIRoomCore.getRoomUsers();
}

function cancel() {
  resetState();
}

// 主动解散房间
async function dismissRoom() {
  try {
    logger.log(`${logPrefix}dismissRoom: enter`);
    const response = await TUIRoomCore.destroyRoom();
    await TUIRoomCore.logout();
    logger.log(`${logPrefix}dismissRoom:`, response);
    resetState();
    emit('onRoomDestroy', { code: 0, message: '' });
  } catch (error) {
    logger.error(`${logPrefix}dismissRoom error:`, error);
  }
}

// 主动离开房间
async function leaveRoom() { // eslint-disable-line
  try {
    if (basicInfo.role === ETUIRoomRole.MASTER) {
      currentDialogType.value = DialogType.TransferDialog;
      return;
    }
    const response = await TUIRoomCore.exitRoom();
    await TUIRoomCore.logout();
    logger.log(`${logPrefix}leaveRoom:`, response);
    resetState();
    emit('onRoomExit', { code: 0, message: '' });
  } catch (error) {
    logger.error(`${logPrefix}leaveRoom error:`, error);
  }
}

async function transferAndLeave() {
  if (!selectedUser.value) {
    return;
  }
  try {
    const userId = selectedUser.value;
    let response = await TUIRoomCore.transferRoomMaster(userId);
    logger.log(`${logPrefix}transferAndLeave:`, response);
    response = await TUIRoomCore.exitRoom();
    logger.log(`${logPrefix}transferAndLeave:`, response);
    resetState();
    emit('onRoomExit', { code: 0, message: '' });
  } catch (error) {
    logger.error(`${logPrefix}transferAndLeave error:`, error);
  }
}

// 收到主持人解散房间通知
const onRoomDestroyed = async () => {
  if (basicInfo.userId === basicInfo.masterUserId) {
    return;
  }
  try {
    ElMessageBox.alert('主持人结束会议，已解散房间', '通知', {
      confirmButtonText: '确认',
      callback: () => {
        resetState();
        emit('onRoomDestroy', { code: 0, message: '' });
      },
    });
  } catch (error) {
    logger.error(`${logPrefix}onRoomDestroyed error:`, error);
  }
};
// 收到主持人移交权限通知
const onRoomMasterChanged = async (newOwnerID:string) => {
  // 新主持人
  const tipMessage =  `主持人已变更为${newOwnerID}`;
  ElMessage({
    type: 'success',
    message: tipMessage,
  });
  basicInfo.masterUserId = newOwnerID;
  if (basicInfo.userId === basicInfo.masterUserId) {
    basicInfo.role = ETUIRoomRole.MASTER;
  } else {
    roomStore.setRemoteUserRole(newOwnerID, ETUIRoomRole.MASTER);
  }
  resetState();
};

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onRoomDestroyed, onRoomDestroyed);
  TUIRoomCore.on(ETUIRoomEvents.onRoomMasterChanged, onRoomMasterChanged);
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onRoomDestroyed, onRoomDestroyed);
  TUIRoomCore.off(ETUIRoomEvents.onRoomMasterChanged, onRoomMasterChanged);
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';
@import '../../assets/style/element-custom.scss';

  .end-button {
    width: 90px;
    height: 40px;
    border: 2px solid #FF2E2E;
    border-radius: 4px;
    font-weight: 400;
    font-size: 14px;
    color: #FF2E2E;
    letter-spacing: 0;
    cursor: pointer;
    text-align: center;
    line-height: 36px;
    &:hover {
      background-color: #FF2E2E;
      color: $whiteColor;
    }
  }
</style>
