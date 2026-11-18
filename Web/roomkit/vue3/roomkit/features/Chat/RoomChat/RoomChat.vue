<template>
  <div
    v-if="canUseChatContext"
    :key="channel"
    class="chat-panel"
    :class="{ 'is-mobile': mobile }"
    @dblclick="onDoubleClick"
  >
    <!-- Scene chrome (the education title bar) rides in through the slot;
         the panel itself stays scene-agnostic. -->
    <slot name="header" />
    <ChatNoticeCard v-if="isShowNotice" :channel="channel" />
    <MessageList
      class="chat-panel-list"
      :mobile="mobile"
      :active="active"
      :channel="channel"
      :message-action-list="messageActionList"
      :is-show-member-notice="isShowMemberNotice"
      :is-hide-timestamp="isHideTimestamp"
      :is-highlight-owner="isHighlightOwner"
      :is-show-new-messages="isShowNewMessages"
    >
      <template v-if="$slots.meta" #meta="slotProps">
        <slot name="meta" v-bind="slotProps" />
      </template>
    </MessageList>
    <MessageInputMobile
      v-if="mobile"
      class="chat-panel-input"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="inputDisabled"
      :active="active"
    />
    <MessageInputPC
      v-else
      class="chat-panel-input"
      :channel="channel"
      :placeholder="placeholder"
      :disabled="inputDisabled"
      :is-hide-operator="isHideOperator"
    />
    <!-- A panel with no chat button binds the IM group itself. -->
    <ChatContextSync :channel="channel" is-active />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLoginState, useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { t } from '../../../base';
import { useParticipantPermission } from '../../Participants/participantData';
import ChatContextSync from '../ChatButton/ChatContextSync.vue';
import ChatNoticeCard from './ChatNoticeCard.vue';
import MessageInputMobile from './MessageInputMobile.vue';
import MessageInputPC from './MessageInputPC.vue';
import MessageList from './MessageList.vue';
import { provideChatComposer } from './useChatComposer';
import { useMessageActions } from './useMessageActions';
import { useSilenceAll } from './useSilenceAll';

const props = withDefaults(defineProps<{
  /** Renders the touch list and the mobile composer. */
  mobile?: boolean;
  /** Mobile composer: the panel is on screen, so the keyboard may open. */
  active?: boolean;
  /** Whether member notices render in this list. */
  isShowMemberNotice?: boolean;
  /** Hides the composer's toolbar row. */
  isHideOperator?: boolean;
  /** Hides message timestamps. */
  isHideTimestamp?: boolean;
  /** Tints the room owner's bubbles with the self-message accent. */
  isHighlightOwner?: boolean;
  /** Shows the notice card above the message list. */
  isShowNotice?: boolean;
  /** Composer placeholder; the room default applies when unset. */
  placeholder?: string;
  /** Swaps the jump circle for an "N new messages" pill while rows land unread. */
  isShowNewMessages?: boolean;
}>(), {
  mobile: false,
  active: false,
  isShowMemberNotice: false,
  isHideOperator: false,
  isHideTimestamp: false,
  isHighlightOwner: false,
  isShowNotice: false,
  placeholder: undefined,
  isShowNewMessages: false,
});

const { localParticipant } = useRoomParticipantState();
const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();

const channel = computed(() => currentRoom.value?.roomId || '');
const canUseChatContext = computed(() => Boolean(currentRoom.value?.roomId && loginUserInfo.value?.userId));
const { isHostOrAdmin } = useParticipantPermission();
// Either source closes the composer. The classroom switch only publishes the
// timeline event: the engine flag would silence the sender's account too.
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
  return props.placeholder ?? t('RoomChat.input_placeholder');
});

const messageActionList = useMessageActions();

provideChatComposer();

function onDoubleClick(event: MouseEvent) {
  if (props.mobile) event.stopPropagation();
}
</script>

<style scoped lang="scss">
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.chat-panel.is-mobile {
  color: var(--rk-text-primary);

  /* A second tap must not be waited on, or the first tap only dismisses the keyboard. */
  touch-action: manipulation;
}

.chat-panel-list {
  flex: 1;
  min-height: 0;
  padding: 4px 12px 0;
  overflow: hidden;
}

/* This class falls through onto MessageList, so it must restate the mobile inset. */
.chat-panel.is-mobile .chat-panel-list {
  padding: 10px 12px;
}

.chat-panel-input {
  flex-shrink: 0;
}
</style>
