import { computed, ref, type Ref } from 'vue';
import {
  useConversationListState,
  useMessageInputState,
  useMessageListState,
} from 'tuikit-atomicx-vue3';
import {
  normalizeConsultationTimestamp,
  type ConsultationMessageLike,
} from '@/features/consultation/utils';

export function useConsultationChat(options: {
  peerUserId: Ref<string | undefined>;
  sessionStartedAt: Ref<number>;
  emptyErrorText?: string;
}) {
  const { createC2CConversation, setActiveConversation, activeConversation } =
    useConversationListState();
  const { messageList } = useMessageListState();
  const { sendMessage } = useMessageInputState();

  const chatInput = ref('');
  const chatError = ref('');
  const isSendingMessage = ref(false);

  const chatMessages = computed(() =>
    ([...(messageList.value ?? [])] as unknown as ConsultationMessageLike[])
      .filter(
        item =>
          normalizeConsultationTimestamp((item as { time?: number }).time) >=
          options.sessionStartedAt.value
      )
      .slice(-120)
  );

  async function ensureChatConversation() {
    chatError.value = '';
    if (!options.peerUserId.value) {
      return;
    }
    try {
      const conversation = await createC2CConversation(options.peerUserId.value);
      await setActiveConversation(conversation.conversationID);
    } catch (error) {
      chatError.value =
        error instanceof Error
          ? error.message
          : options.emptyErrorText || '会话初始化失败';
    }
  }

  async function handleSendMessage() {
    const content = chatInput.value.trim();
    if (!content || isSendingMessage.value) {
      return;
    }
    isSendingMessage.value = true;
    chatError.value = '';
    try {
      if (!activeConversation.value?.conversationID) {
        await ensureChatConversation();
      }
      await sendMessage(content);
      chatInput.value = '';
    } catch (error) {
      chatError.value = error instanceof Error ? error.message : '消息发送失败';
    } finally {
      isSendingMessage.value = false;
    }
  }

  async function clearChatConversation() {
    chatInput.value = '';
    chatError.value = '';
    isSendingMessage.value = false;
    try {
      await setActiveConversation('');
    } catch {
      // no-op: clearing local active conversation can fail silently
    }
  }

  return {
    activeConversation,
    chatInput,
    chatError,
    isSendingMessage,
    chatMessages,
    ensureChatConversation,
    handleSendMessage,
    clearChatConversation,
  };
}
