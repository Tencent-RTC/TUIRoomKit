<template>
  <div class="chat-control-container">
    <el-badge
      v-if="chatStore.unReadCount > 0"
      :value="chatStore.unReadCount > 10 ? '10+' : chatStore.unReadCount"
    >
      <icon-button
        :title="t('Chat')"
        :icon-name="iconName"
        @click-icon="toggleChatSidebar"
      />
    </el-badge>
    <icon-button
      v-else
      :is-active="sidebarName === 'chat'"
      :title="t('Chat')"
      :icon-name="iconName"
      @click-icon="toggleChatSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import useGetRoomEngine from '../../hooks/useRoomEngine';

const { t } = useI18n();
const roomEngine = useGetRoomEngine();

const basicStore = useBasicStore();
const chatStore = useChatStore();
const { sidebarName, roomId } = storeToRefs(basicStore);

const iconName = computed(() => (sidebarName.value === 'chat' ? ICON_NAME.ChatActive : ICON_NAME.Chat));

async function toggleChatSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'chat') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }

  const { currentMessageList, isCompleted, nextReqMessageId } = await getMessageList();

  const filterCurrentMessageList = currentMessageList.filter((item: any) => item.type === 'TIMTextElem');

  chatStore.setMessageListInfo(filterCurrentMessageList, isCompleted, nextReqMessageId);
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('chat');
  chatStore.updateUnReadCount(0);
}

async function getMessageList(): Promise<{
  currentMessageList: any[];
  isCompleted: boolean,
  nextReqMessageId: string,
}> {
  let count = 0;
  const result: {
    currentMessageList: any[],
    isCompleted: boolean,
    nextReqMessageId: string,
  } = {
    currentMessageList: [],
    isCompleted: false,
    nextReqMessageId: '',
  };
  const tim: any = roomEngine.instance?.getTIM();

  const getIMMessageList = async () => {
    const conversationData: {
      conversationID: string,
      nextReqMessageID?: string | undefined;
    } = {
      conversationID: `GROUP${roomId.value}`,
    };
    if (result.nextReqMessageId !== '') {
      conversationData.nextReqMessageID = result.nextReqMessageId;
    }
    const imResponse = await tim.getMessageList(conversationData);
    const { messageList, isCompleted, nextReqMessageID } = imResponse.data;
    result.currentMessageList.splice(0, 0, ...messageList);
    result.isCompleted = messageList.length > 0 ? isCompleted : true;
    result.nextReqMessageId = nextReqMessageID;

    if (result.isCompleted || result.currentMessageList.length >= 15) {
      return;
    }
    count += 1;
    if (count === 1) {
      await getIMMessageList();
    }
  };

  await getIMMessageList();

  return result;
};
</script>

<style lang="scss">
.chat-control-container .el-badge .el-badge__content {
  top: 14px;
  right: 24px;
  background-color: #006EFF;
}
</style>
