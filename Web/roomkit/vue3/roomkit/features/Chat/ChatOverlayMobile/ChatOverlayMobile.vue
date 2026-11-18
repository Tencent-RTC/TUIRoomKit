<template>
  <div
    class="chat-overlay"
    :class="{
      'is-muted': inputDisabled,
      'is-collapsible': collapsible,
      'is-fold-mode': foldMode,
      'is-collapsed': collapsed,
    }"
  >
    <div class="chat-overlay-lines-wrap">
      <TUIList
        ref="listRef"
        v-model:stick-to-bottom="stickToBottom"
        class="chat-overlay-lines"
        :class="{ 'is-empty': !lines.length }"
        variant="plain"
        item-size="auto"
        :scrollbar="false"
      >
        <div
          v-for="line in lines"
          :key="line.id"
          class="chat-overlay-item"
          :class="{ 'is-system': line.system }"
        >
          <template v-if="line.system">
            {{ line.text }}
          </template>
          <template v-else>
            <span class="chat-overlay-who">
              <b class="chat-overlay-name">{{ line.name }}</b>
              <em v-if="line.teacher" class="chat-overlay-tag">{{ t('Education.Teacher') }}</em>
            </span>
            <span class="chat-overlay-colon">{{ t('Education.Barrage.Colon') }}</span>
            <span class="chat-overlay-text">{{ line.text }}</span>
          </template>
        </div>
      </TUIList>
      <!-- Landscape barrage unread reminder (views-edu rk-edu-chat-overlay__jump):
           floats at the lines' bottom-left while the reader is scrolled away. -->
      <button
        v-if="!collapsed && newLineCount > 0"
        type="button"
        class="chat-overlay-jump"
        :aria-label="t('RoomChat.jump_to_latest')"
        @click="jumpToNewLines"
      >
        <span>{{ newLineLabel }}</span>
        <IconCollapse :size="11" />
      </button>
    </div>
    <p class="chat-overlay-hint" :hidden="lines.length > 0">
      <IconAISpark :size="14" />
      <span>{{ t('Education.Barrage.EmptyHint') }}</span>
    </p>
    <form class="chat-overlay-composer" @submit.prevent="sendText">
      <input
        ref="fieldRef"
        v-model="draft"
        class="chat-overlay-field"
        type="text"
        autocomplete="off"
        :placeholder="placeholder"
        :disabled="inputDisabled"
        :maxlength="1000"
      >
      <button
        class="chat-overlay-send"
        :type="foldMode ? 'button' : 'submit'"
        :disabled="inputDisabled && !foldMode"
        :aria-label="foldMode ? t('Education.Chat.Collapse') : t('RoomChat.send')"
        @click="onActionClick"
      >
        <IconSend class="is-send" :size="13" />
        <IconCollapse class="is-fold" :size="13" />
      </button>
    </form>
    <button
      type="button"
      class="chat-overlay-fab"
      :aria-label="t('Education.Chat.Expand')"
      @click="expand"
    >
      <IconChat :size="16" />
      <em v-if="unreadLabel" class="chat-overlay-badge">{{ unreadLabel }}</em>
    </button>
    <ChatContextSync
      v-if="collapsible"
      :channel="channel"
      :is-active="!collapsed"
      @unread-change="unreadCount = $event"
    />
    <!-- The pill tally rides the same counter the FAB badge uses, with
         "watching" meaning the lines are pinned to the bottom: rows that land
         while the reader is scrolled away count, reaching the bottom clears. -->
    <ChatContextSync
      :channel="channel"
      :is-active="stickToBottom"
      @unread-change="newLineCount = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';
import { MessageStatus, MessageType, useChatContext } from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { IconAISpark, IconChat, IconCollapse, IconSend, TUIList, TUIToast, t } from '../../../base';
import { useParticipantPermission } from '../../Participants/participantData';
import { EDU_CLASS_EVENT_ID, parseCustomEnvelope } from '../customMessage';
import { findNoticeEvent, isHiddenProtocolMessage, shouldHideMemberNotice } from '../RoomChat/memberNotice';
import ChatContextSync from '../ChatButton/ChatContextSync.vue';
import { getSendErrorMessage } from '../RoomChat/getSendErrorMessage';
import { useSilenceAll } from '../RoomChat/useSilenceAll';
import { useSenderProfile } from '../RoomChat/useSenderName';

const props = withDefaults(defineProps<{
  channel: string;
  /** Landscape barrage can fold into a chat button. Matches rk-edu-chat-overlay[collapsible]. */
  collapsible?: boolean;
  /** i18n key of the composer placeholder; the scene picks it by class mode. */
  placeholderKey?: string;
}>(), { collapsible: false, placeholderKey: 'Education.Chat.Placeholder' });

const { messageList, sendMessage } = useChatContext(props.channel);
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const resolveProfile = useSenderProfile();
const draft = ref('');
const listRef = ref<{ scrollToBottom: () => void } | null>(null);
const stickToBottom = ref(true);
const fieldRef = ref<HTMLInputElement | null>(null);
const collapsed = ref(false);
const unreadCount = ref(0);

const { isHostOrAdmin } = useParticipantPermission();
// Either source closes the composer. The classroom switch only publishes the
// timeline event: the engine flag would silence the sender's account too
// (same rule as RoomChat.vue).
const { silenceAll: timelineSilenced } = useSilenceAll();
const isAllSilenced = computed(() => !isHostOrAdmin.value && (
  timelineSilenced.value || Boolean(currentRoom.value?.isAllMessageDisabled)
));
const inputDisabled = computed(() => (
  Boolean(localParticipant.value?.isMessageDisabled) || isAllSilenced.value
));
const placeholder = computed(() => {
  if (isAllSilenced.value) return t('Education.Sync.ChatDisabled');
  if (inputDisabled.value) return t('RoomChat.disabled_placeholder');
  return t(props.placeholderKey);
});
const foldMode = computed(() => props.collapsible && (inputDisabled.value || draft.value.trim().length === 0));

interface BarrageLine {
  id: string;
  system: boolean;
  name: string;
  teacher: boolean;
  text: string;
}

function noticeText(message: MessageInfo): string {
  const envelope = parseCustomEnvelope(message);
  // The sender never renders their own enter or leave line (see shouldHideMemberNotice for why).
  if (!envelope || shouldHideMemberNotice(message, EDU_CLASS_EVENT_ID)) {
    return '';
  }
  const notice = findNoticeEvent(envelope, { barrage: true, status: message.status });
  return notice ? t(notice.key, notice.params) : '';
}

const lines = computed<BarrageLine[]>(() => {
  const ownerId = currentRoom.value?.roomOwner?.userId ?? '';
  return (messageList.value ?? []).flatMap((message) => {
    if (message.messageType === MessageType.Tips) {
      return [];
    }
    if (isHiddenProtocolMessage(message)) {
      return [];
    }
    if (message.status === MessageStatus.Recalled) {
      const name = resolveProfile(message).name;
      return [{
        id: message.id,
        system: true,
        name: '',
        teacher: false,
        text: message.isSentBySelf ? t('RoomChat.you_recalled') : t('RoomChat.recalled', { name }),
      }];
    }
    const notice = noticeText(message);
    if (notice) {
      return [{ id: message.id, system: true, name: '', teacher: false, text: notice }];
    }
    if (message.messageType !== MessageType.Text) {
      return [];
    }
    const text = message.messagePayload.text || '';
    if (!text) {
      return [];
    }
    const profile = resolveProfile(message);
    return [{
      id: message.id,
      system: false,
      name: profile.name,
      teacher: Boolean(ownerId) && message.from?.userID === ownerId,
      text,
    }];
  });
});

const unreadLabel = computed(() => {
  if (!collapsed.value || unreadCount.value <= 0) {
    return '';
  }
  return unreadCount.value > 99 ? '99+' : String(unreadCount.value);
});

/* Lines that land while the reader is scrolled away; the jump pill reads it. */
const newLineCount = ref(0);
const newLineLabel = computed(() => (
  t('RoomChat.new_messages', { count: newLineCount.value > 99 ? '99+' : newLineCount.value })
));

function jumpToNewLines() {
  // Reaching the bottom clears the tally; the pin lands the reader on them.
  stickToBottom.value = true;
  listRef.value?.scrollToBottom();
}

function collapse() {
  if (!props.collapsible || collapsed.value) {
    return;
  }
  fieldRef.value?.blur();
  collapsed.value = true;
}

function expand() {
  if (!collapsed.value) {
    return;
  }
  collapsed.value = false;
  stickToBottom.value = true;
  nextTick(() => listRef.value?.scrollToBottom());
}

function onActionClick(event: MouseEvent) {
  if (!foldMode.value) {
    return;
  }
  event.preventDefault();
  collapse();
}

async function sendText() {
  const text = draft.value.trim();
  if (inputDisabled.value || !text) {
    return;
  }
  draft.value = '';
  stickToBottom.value = true;
  try {
    await sendMessage({ type: 'textMessage', text });
  } catch (error) {
    draft.value = text;
    TUIToast.error(getSendErrorMessage(error));
  }
}
</script>

<style scoped lang="scss" src="./ChatOverlayMobile.scss"></style>
