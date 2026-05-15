<script setup lang="ts">
import { Copy, Download, Mic, MicOff } from '@/shared/icons';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { formatConsultationClock } from '@/features/consultation/utils';
import type { ConsultationTranscriptItem } from '@/features/consultation/types';

defineProps<{
  transcriptList: ConsultationTranscriptItem[];
  transcriptText: string;
  transcriberRunning: boolean;
  transcriberBusy: boolean;
  transcriberHint?: string;
  isCopyingDraft: boolean;
  isExportingDraft: boolean;
  getSpeakerName: (userId: string) => string;
}>();

const emit = defineEmits<{
  toggle: [];
  copy: [];
  export: [];
}>();
</script>

<template>
  <div class="h-full min-h-0 flex flex-col">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">实时语音转写</h3>
      <button
        @click="emit('toggle')"
        :disabled="transcriberBusy"
        :class="[
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors',
          transcriberRunning
            ? 'bg-[#0D9488] text-white border-[#0D9488]'
            : 'bg-white text-gray-700 border-gray-200 hover:border-[#0D9488] hover:text-[#0D9488]',
        ]"
      >
        <LoadingSpinner v-if="transcriberBusy" />
        <component v-else :is="transcriberRunning ? Mic : MicOff" :size="14" />
        {{
          transcriberBusy
            ? '处理中...'
            : transcriberRunning
              ? '转写中'
              : '开启转写'
        }}
      </button>
    </div>
    <div class="px-4 py-2 text-xs text-[#0D9488] min-h-6">
      {{ transcriberHint }}
    </div>
    <div class="px-4 pb-3">
      <div
        class="h-[330px] rounded-3xl border border-[#E6EEF5] overflow-y-auto bg-white"
      >
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-[#EEF2F6] text-sm text-gray-500"
        >
          <span class="inline-flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#86EFAC]"></span>
            实时转写中
          </span>
          <span>{{ transcriptList.length }}条对话</span>
        </div>
        <div class="p-4 space-y-3">
          <div
            v-for="item in transcriptList"
            :key="item.segmentId"
            class="flex items-start gap-2"
          >
            <div
              class="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ getSpeakerName(item.speakerUserId).charAt(0) }}
            </div>
            <div class="max-w-[85%]">
              <div class="text-xs text-[#64748B] mb-1">
                {{ getSpeakerName(item.speakerUserId) }}
                {{ formatConsultationClock(item.timestamp) }}
              </div>
              <div
                class="rounded-2xl bg-[#0D9488] text-white px-3 py-2 text-sm leading-6"
              >
                {{ item.sourceText }}
              </div>
            </div>
          </div>
          <div
            v-if="transcriptList.length === 0"
            class="h-[250px] flex items-center justify-center text-center text-gray-400"
          >
            <div>
              <MicOff :size="44" class="mx-auto mb-2 text-gray-300" />
              <p class="text-sm">
                {{
                  transcriberRunning
                    ? '等待语音输入...'
                    : '点击上方按钮开启实时转写'
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="px-4 pb-3 grid grid-cols-2 gap-3">
      <button
        @click="emit('copy')"
        :disabled="isCopyingDraft || !transcriptText"
        class="h-10 rounded-2xl border border-[#E2E8F0] text-[#0F172A] font-medium inline-flex items-center justify-center gap-2 hover:border-[#0D9488] hover:text-[#0D9488] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LoadingSpinner v-if="isCopyingDraft" />
        <Copy v-else :size="16" />
        {{ isCopyingDraft ? '复制中...' : '复制' }}
      </button>
      <button
        @click="emit('export')"
        :disabled="isExportingDraft || !transcriptText"
        class="h-10 rounded-2xl border border-[#E2E8F0] text-[#0F172A] font-medium inline-flex items-center justify-center gap-2 hover:border-[#0D9488] hover:text-[#0D9488] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <LoadingSpinner v-if="isExportingDraft" />
        <Download v-else :size="16" />
        {{ isExportingDraft ? '导出中...' : '导出' }}
      </button>
    </div>
    <div class="px-4 pb-4 text-xs text-gray-500 leading-6">
      <p>• 支持实时转写内容复制与导出</p>
    </div>
  </div>
</template>
