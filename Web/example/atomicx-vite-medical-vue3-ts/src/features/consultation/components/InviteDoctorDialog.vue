<script setup lang="ts">
import { Search, X } from '@/shared/icons';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import type { DoctorInviteListItem } from '@/features/consultation/types';

defineProps<{
  visible: boolean;
  doctorInviteList: DoctorInviteListItem[];
  inviteFeedback?: string;
  invitingDoctorId?: string | null;
  cancellingDoctorId?: string | null;
}>();

const inviteKeyword = defineModel<string>('inviteKeyword', { default: '' });
const emit = defineEmits<{
  close: [];
  invite: [userId: string];
  cancelInvite: [userId: string];
}>();
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-[760px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(15,23,42,0.25)] overflow-hidden"
    >
      <div
        class="h-[72px] px-6 flex items-center justify-between border-b border-[#EEF2F6]"
      >
        <h3 class="text-[18px] leading-none font-semibold text-[#0F172A]">
          邀请会诊医生
        </h3>
        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#334155] transition-colors flex items-center justify-center"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="p-6">
        <div class="relative">
          <Search
            class="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            :size="20"
          />
          <input
            v-model="inviteKeyword"
            class="w-full h-12 rounded-2xl bg-[#F8FAFC] border border-[#EEF2F6] pl-11 pr-4 text-[15px] text-[#0F172A] outline-none focus:border-[#0D9488]"
            placeholder="搜索医生姓名或科室"
          />
        </div>

        <div class="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
          <div
            v-for="item in doctorInviteList"
            :key="item.userId"
            class="h-[92px] rounded-2xl border border-[#EEF2F6] px-5 flex items-center justify-between"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-[24px] font-semibold shrink-0"
              >
                {{ item.userName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p
                  class="text-[20px] leading-none font-semibold text-[#0F172A] truncate"
                >
                  {{ item.userName }}
                </p>
                <p
                  class="mt-1.5 text-[17px] leading-none text-[#6B7280] truncate"
                >
                  {{ item.department }} · {{ item.title }}
                </p>
              </div>
            </div>
            <button
              @click="
                item.inviteStatus === 'pending'
                  ? emit('cancelInvite', item.userId)
                  : emit('invite', item.userId)
              "
              :disabled="
                invitingDoctorId === item.userId ||
                cancellingDoctorId === item.userId
              "
              :class="[
                'w-[104px] h-[44px] rounded-full text-[16px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors',
                item.inviteStatus === 'pending'
                  ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100'
                  : 'bg-[#0D9488] text-white hover:bg-[#0F766E]',
              ]"
            >
              <LoadingSpinner
                v-if="
                  invitingDoctorId === item.userId ||
                  cancellingDoctorId === item.userId
                "
                class="mr-1"
              />
              {{
                invitingDoctorId === item.userId
                  ? '邀请中'
                  : cancellingDoctorId === item.userId
                    ? '取消中'
                    : item.inviteStatus === 'pending'
                      ? '取消'
                      : '邀请'
              }}
            </button>
          </div>

          <div
            v-if="doctorInviteList.length === 0"
            class="h-[140px] flex items-center justify-center text-[14px] text-[#94A3B8]"
          >
            未找到可邀请的医生
          </div>
        </div>
        <p class="mt-3 text-xs text-[#0D9488] min-h-5">{{ inviteFeedback }}</p>
      </div>
    </div>
  </div>
</template>
