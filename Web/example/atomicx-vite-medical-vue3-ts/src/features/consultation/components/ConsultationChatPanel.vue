<script setup lang="ts">
import { Send } from '@/shared/icons';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import {
  formatConsultationClock,
  getConsultationMessageText,
  type ConsultationMessageLike,
} from '@/features/consultation/utils';
import type { MedicalUser } from '@/services/adapters';

defineProps<{
  doctor: MedicalUser;
  patient: MedicalUser;
  messages: ConsultationMessageLike[];
  activeConversationId?: string;
  chatError?: string;
  isSendingMessage?: boolean;
}>();

const chatInput = defineModel<string>('chatInput', { default: '' });
const emit = defineEmits<{
  send: [];
}>();

function getMessageId(message: ConsultationMessageLike, index: number) {
  return (message as { ID?: string }).ID || index;
}

function isOutgoingMessage(message: ConsultationMessageLike) {
  return (message as { flow?: string }).flow === 'out';
}

function getMessageTime(message: ConsultationMessageLike) {
  return (message as { time?: number }).time;
}
</script>

<template>
  <div class="h-full min-h-0 flex flex-col">
    <div class="px-4 pt-4">
      <div
        class="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700"
      >
        对话内容已加密，可直接与患者实时沟通。当前仅展示会诊场景文本消息。
      </div>
    </div>
    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
      <div
        v-for="(item, index) in messages"
        :key="getMessageId(item, index)"
        :class="[
          'flex gap-2',
          isOutgoingMessage(item) ? 'justify-end' : 'justify-start',
        ]"
      >
        <template v-if="!isOutgoingMessage(item)">
          <div
            class="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs flex items-center justify-center shrink-0"
          >
            {{ patient.userName.charAt(0) }}
          </div>
          <div class="max-w-[72%]">
            <div
              class="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-800"
            >
              {{ getConsultationMessageText(item) }}
            </div>
            <p class="text-[11px] text-gray-400 mt-1">
              {{ formatConsultationClock(getMessageTime(item)) }}
            </p>
          </div>
        </template>
        <template v-else>
          <div class="max-w-[72%]">
            <div
              class="bg-[#0D9488] text-white rounded-2xl px-3 py-2 text-sm shadow-[0_4px_12px_rgba(13,148,136,0.25)]"
            >
              {{ getConsultationMessageText(item) }}
            </div>
            <p class="text-[11px] text-gray-400 mt-1 text-right">
              {{ formatConsultationClock(getMessageTime(item)) }}
            </p>
          </div>
          <div
            class="w-6 h-6 rounded-full bg-[#0D9488] text-white text-xs flex items-center justify-center shrink-0"
          >
            {{ doctor.userName.charAt(0) }}
          </div>
        </template>
      </div>
      <div
        v-if="messages.length === 0"
        class="text-center text-sm text-gray-400 py-8"
      >
        {{ activeConversationId ? '暂无聊天消息' : '正在初始化会话...' }}
      </div>
    </div>
    <div class="p-4 border-t border-gray-100">
      <div class="flex items-center gap-2">
        <input
          v-model="chatInput"
          @keyup.enter="emit('send')"
          class="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0D9488]"
          placeholder="输入消息..."
        />
        <button
          @click="emit('send')"
          :disabled="isSendingMessage"
          class="w-10 h-10 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="isSendingMessage" />
          <Send v-else :size="16" />
        </button>
      </div>
      <div class="mt-2 flex items-center justify-between text-xs">
        <span class="text-red-500">{{ chatError }}</span>
        <span class="text-gray-400">{{ messages.length }} 条消息</span>
      </div>
    </div>
  </div>
</template>
