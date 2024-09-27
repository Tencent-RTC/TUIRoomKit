<template>
  <div class="chat-container">
    <TUIChat v-if="basicStore.scene !== 'chat'" />
    <div v-else class="chat-container-chat-scene">
      <message-list />
      <chat-editor />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import {
  StoreName,
  TUIConversationService,
  TUIStore,
} from '@tencentcloud/chat-uikit-engine';

import Server from '../ChatKit/server';
import { roomService, Theme, LanguageOption } from '../../../services';
import { hideTUIChatFeatures } from '../ChatKit/components/TUIChat/config';
import TUIChatServer from '../ChatKit/components/TUIChat/server';
// todo Remove this logic when chat is released
import MessageList from '../MessageList';
import ChatEditor from '../ChatEditor';

import { useBasicStore } from '../../../stores/basic';
const TUIChat = defineAsyncComponent(
  () => import('../ChatKit/components/TUIChat/index.vue')
);

const basicStore = useBasicStore();

const defaultHideFeaturesButtons = [
  'InputFace',
  'InputVoice',
  'InputEvaluation',
  'InputQuickReplies',
  'InputMention',
  'QuoteMessage',
  'ForwardMessage',
  'TranslateMessage',
  'VoiceToText',
  'EmojiReaction',
  'MultiSelection',
  'MessageSearch',
  'ReadStatus',
];

const currentRoomId = `GROUP${basicStore.roomId}`;

const chatKitServer = new Server();
chatKitServer.init();
new TUIChatServer();

TUIConversationService.switchConversation(currentRoomId);
hideTUIChatFeatures(defaultHideFeaturesButtons);
roomService.setTheme(basicStore.defaultTheme as Theme);
roomService.setLanguage(basicStore.lang as LanguageOption);
TUIStore.watch(StoreName.CONV, {
  currentConversationID: onCurrentConversationIDUpdate,
});

function onCurrentConversationIDUpdate(currentConversationID: string) {
  roomService.chatManager.setChatType(currentConversationID === currentRoomId);
}
</script>

<style lang="scss" scoped>
.chat-container {
  width: 100%;
  height: 100%;
}

.chat-container-chat-scene {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}
</style>
