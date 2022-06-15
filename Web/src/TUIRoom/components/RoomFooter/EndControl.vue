<template>
  <div class="end-button" tabindex="1" @click="stopMeeting">结束会议</div>
  <el-dialog
    :model-value="visible"
    :title="title"
    :modal="true"
    :append-to-body="true"
    width="420px"
    :before-close="cancel"
  >
    <div v-if="!showTransfer">
      <!-- <span v-if="basicInfo.role === ETUIRoomRole.MASTER">您当前是房间主持人，请选择相应操作。若选择“离开房间”，则房间不会解散，您需要指定新主持人。</span> -->
      <span v-if="basicInfo.role === ETUIRoomRole.MASTER">您当前是房间主持人，点击解散房间会将所有人移出房间。</span>
      <span v-else>确定离开房间吗？</span>
    </div>
    <div v-else>
      <div>选择主持人</div>
      <div>
        <el-select v-model="selectedUser">
          <el-option
            v-for="user in validRoomMember"
            :key="user.userId"
            :value="user.userId"
            :label="user.name"
          />
        </el-select>
      </div>
    </div>
    <template #footer>
      <template v-if="!showTransfer">
        <el-button v-if="basicInfo.role === ETUIRoomRole.MASTER" type="primary" @click="dismissRoom">解散房间</el-button>
        <el-button v-if="basicInfo.role === ETUIRoomRole.ANCHOR" type="primary" @click="leaveRoom">离开房间</el-button>
      </template>
      <template v-else>
        <el-button type="primary" @click="transferAndLeave">移交并离开</el-button>
      </template>
      <el-button @click="cancel">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, Ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import TUIRoomCore, { ETUIRoomRole, ETUIRoomEvents } from '../../tui-room-core';
import logger from '../../tui-room-core/common/logger';
import { useBasicStore } from '../../stores/basic';
import { computed } from '@vue/reactivity';

const logPrefix = '[EndControl]';

const emit = defineEmits(['onRoomExit', 'onRoomDestroy']);

const visible: Ref<boolean> = ref(false);
const showTransfer: Ref<boolean> = ref(false);
const basicInfo = useBasicStore();
logger.log(`${logPrefix} basicInfo:`, basicInfo);

const title = computed(() => (!showTransfer.value ? '是否要离开房间' : '请选择新的房间主持人'));

const selectedUser: Ref<string> = ref('');
const roomMember = ref(TUIRoomCore.getRoomUsers());
const validRoomMember = computed(() => roomMember.value.filter(item => item.userId !== basicInfo.userId));

function resetState() {
  visible.value = false;
  showTransfer.value = false;
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
    if (basicInfo.role === ETUIRoomRole.ANCHOR) {
      const response = await TUIRoomCore.exitRoom();
      await TUIRoomCore.logout();
      logger.log(`${logPrefix}leaveRoom:`, response);
      resetState();
      emit('onRoomExit', { code: 0, message: '' });
    } else {
      showTransfer.value = true;
    }
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

onMounted(() => {
  TUIRoomCore.on(ETUIRoomEvents.onRoomDestroyed, onRoomDestroyed);
});

onUnmounted(() => {
  TUIRoomCore.off(ETUIRoomEvents.onRoomDestroyed, onRoomDestroyed);
});

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

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
