<template>
  <div class="end-button" tabindex="1" @click="stopMeeting">{{ t('End') }}</div>
  <el-dialog
    :model-value="visible"
    class="custom-element-class"
    :title="title"
    :modal="true"
    :append-to-body="false"
    width="420px"
    :before-close="cancel"
  >
    <div v-if="currentDialogType === DialogType.BasicDialog">
      <span v-if="roomStore.isMaster">
        <!-- eslint-disable-next-line max-len -->
        {{ t('You are currently the room host, please select the appropriate action.If you select "Leave Room", the room will not be dissolved and you will need to appoint a new host.') }}
      </span>
      <span v-else>{{ t('Are you sure you want to leave this room?') }}</span>
    </div>
    <div v-if="currentDialogType === DialogType.TransferDialog">
      <div>{{ t('New host') }}</div>
      <div>
        <el-select
          v-model="selectedUser"
          :teleported="false"
        >
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
        <el-button v-if="roomStore.isMaster" type="primary" @click="dismissRoom">
          {{ t('Dismiss') }}
        </el-button>
        <el-button v-if="showLeaveRoom" type="primary" @click="leaveRoom">{{ t('Leave') }}</el-button>
        <el-button @click="cancel">{{ t('Cancel') }}</el-button>
      </div>
      <div v-if="currentDialogType === DialogType.TransferDialog">
        <el-button type="primary" @click="transferAndLeave">{{ t('Transfer and leave') }}</el-button>
        <el-button @click="cancel">{{ t('Cancel') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onUnmounted, ref, Ref, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import TUIRoomEngine, { TUIRole, TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import useGetRoomEngine from '../../hooks/useRoomEngine';

const roomEngine = useGetRoomEngine();

const { t } = useI18n();

const logPrefix = '[EndControl]';

enum DialogType {
  BasicDialog,
  TransferDialog
}
const currentDialogType = ref(DialogType.BasicDialog);

const emit = defineEmits(['onExitRoom', 'onDestroyRoom']);

const visible: Ref<boolean> = ref(false);
const basicStore = useBasicStore();
console.log(`${logPrefix} basicStore:`, basicStore);

const roomStore = useRoomStore();
const { localUser, remoteAnchorList } = storeToRefs(roomStore);

const title = computed(() => (currentDialogType.value === DialogType.BasicDialog ? t('Leave room?') : t('Select a new host')));
const showLeaveRoom = computed(() => (
  roomStore.isMaster && remoteAnchorList.value.length > 0)
  || !roomStore.isMaster);

const selectedUser: Ref<string> = ref('');

function resetState() {
  visible.value = false;
  currentDialogType.value = DialogType.BasicDialog;
}

function stopMeeting() {
  if (!visible.value) {
    visible.value = true;
  }
}

function cancel() {
  resetState();
}

async function closeMediaBeforeLeave() {
  if (localUser.value.hasAudioStream) {
    await roomEngine.instance?.closeLocalMicrophone();
    await roomEngine.instance?.stopPushLocalAudio();
  }
  if (localUser.value.hasVideoStream) {
    await roomEngine.instance?.closeLocalCamera();
    await roomEngine.instance?.stopPushLocalVideo();
  }
}

/**
 * Active room dismissal
 *
 * 主动解散房间
**/
async function dismissRoom() {
  try {
    console.log(`${logPrefix}dismissRoom: enter`);
    await closeMediaBeforeLeave();
    await roomEngine.instance?.destroyRoom();
    resetState();
    emit('onDestroyRoom', { code: 0, message: '' });
  } catch (error) {
    console.error(`${logPrefix}dismissRoom error:`, error);
  }
}

/**
 * Leave the room voluntarily
 *
 * 主动离开房间
**/
async function leaveRoom() { // eslint-disable-line
  try {
    if (roomStore.isMaster) {
      currentDialogType.value = DialogType.TransferDialog;
      return;
    }
    await closeMediaBeforeLeave();
    const response = await roomEngine.instance?.exitRoom();
    console.log(`${logPrefix}leaveRoom:`, response);
    resetState();
    emit('onExitRoom', { code: 0, message: '' });
  } catch (error) {
    console.error(`${logPrefix}leaveRoom error:`, error);
  }
}

async function transferAndLeave() {
  if (!selectedUser.value) {
    return;
  }
  try {
    const userId = selectedUser.value;
    const changeUserRoleResponse = await roomEngine.instance?.changeUserRole({ userId, role: TUIRole.kRoomOwner });
    console.log(`${logPrefix}transferAndLeave:`, changeUserRoleResponse);
    await closeMediaBeforeLeave();
    const exitRoomResponse = await roomEngine.instance?.exitRoom();
    console.log(`${logPrefix}exitRoom:`, exitRoomResponse);
    resetState();
    emit('onExitRoom', { code: 0, message: '' });
  } catch (error) {
    console.error(`${logPrefix}transferAndLeave error:`, error);
  }
}

/**
 * notification of room dismissal from the host
 *
 * 收到主持人解散房间通知
**/
const onRoomDismissed = async (eventInfo: { roomId: string}) => {
  try {
    const { roomId } = eventInfo;
    console.log(`${logPrefix}onRoomDismissed:`, roomId);
    ElMessageBox.alert(t('The host closed the room.'), t('Note'), {
      customClass: 'custom-element-class',
      confirmButtonText: t('Confirm'),
      callback: async () => {
        resetState();
        emit('onDestroyRoom', { code: 0, message: '' });
      },
    });
  } catch (error) {
    console.error(`${logPrefix}onRoomDestroyed error:`, error);
  }
};

/**
 * By listening for a change in ownerId,
 * the audience receives a notification that the host has handed over the privileges
 *
 * 通过监听ownerId发生改变，观众收到主持人移交权限通知
**/
watch(() => roomStore.masterUserId, (newVal: string, oldVal: string) => {
  // 创建房间或者进入房间时，oldVal为''
  if (oldVal !== '' && newVal !== '' && newVal !== oldVal) {
    let newName = roomStore.getUserName(newVal) || newVal;
    if (newVal === localUser.value.userId) {
      newName = t('me');
    }
    const tipMessage =  `${t('Moderator changed to ')}${newName}`;
    ElMessage({
      type: 'success',
      message: tipMessage,
    });
    if (roomStore.localUser.userId === newVal) {
      roomStore.setLocalUser({ role: TUIRole.kRoomOwner });
    } else {
      roomStore.setRemoteUserRole(newVal, TUIRole.kRoomOwner);
    }
    resetState();
  }
});

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
});

onUnmounted(() => {
  roomEngine.instance?.off(TUIRoomEvents.onRoomDismissed, onRoomDismissed);
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
