<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CheckCircle2, ChevronLeft, FileText, House } from '@/shared/icons';
import { services } from '@/services/adapters';

const route = useRoute();
const router = useRouter();

const appointment = computed(() =>
  services.appointment.getAppointmentById(String(route.params.appointmentId))
);
const doctor = computed(() =>
  appointment.value
    ? services.user.getDoctorById(appointment.value.doctorId)
    : null
);
const durationSeconds = computed(() => Number(route.query.duration || 0));
const durationMinutes = computed(() =>
  Math.max(1, Math.round(durationSeconds.value / 60))
);
const displayDateTime = computed(() => {
  if (!appointment.value) {
    return '';
  }
  const date = new Date(appointment.value.scheduleStartTime * 1000);
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
});
const prescriptionNo = computed(() => {
  if (!appointment.value) {
    return '';
  }
  const date = new Date(appointment.value.scheduleStartTime * 1000);
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `RX${yyyy}${mm}${dd}001`;
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[#F5FAFE] via-[#F3FBF8] to-[#F3F6FD] flex justify-center p-4"
  >
    <div v-if="appointment && doctor" class="w-full max-w-[460px]">
      <div class="h-14 px-2 flex items-center gap-3">
        <button
          @click="router.replace('/patient/select-doctor')"
          class="inline-flex items-center gap-1 text-[#1F2937] text-sm font-medium"
        >
          <ChevronLeft :size="18" />
          返回首页
        </button>
        <h1 class="text-2xl font-semibold text-[#111827]">问诊详情</h1>
      </div>

      <div
        class="bg-[#F3FFF9] border border-[#E6F9F0] rounded-3xl p-4 shadow-sm space-y-4"
      >
        <div class="text-center py-4">
          <div
            class="w-24 h-24 rounded-full bg-gradient-to-br from-[#00C2A8] to-[#0D9488] mx-auto flex items-center justify-center shadow-lg"
          >
            <CheckCircle2 :size="46" class="text-white" />
          </div>
          <h2 class="text-3xl font-semibold text-[#0F172A] mt-3">问诊已完成</h2>
          <p class="text-[#6B7280] mt-2">感谢您的信任，祝您早日康复</p>
        </div>

        <div class="bg-white rounded-3xl p-4 shadow-sm border border-[#EEF2F7]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white font-semibold flex items-center justify-center shrink-0"
              >
                {{ doctor.userName.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-xl font-semibold text-[#111827] truncate">
                  {{ doctor.userName }}
                </p>
                <p class="text-[#6B7280] text-sm truncate">
                  {{ doctor.department }} · {{ doctor.title }}
                </p>
              </div>
            </div>
            <div class="text-right shrink-0 ml-2">
              <p class="text-[#6B7280] text-xs">{{ displayDateTime }}</p>
              <p class="text-[#111827] text-lg font-semibold">
                时长{{ durationMinutes }}分钟
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-3xl p-4 shadow-sm border border-[#EEF2F7] space-y-3"
        >
          <div class="flex items-center gap-2 text-[#334155] font-semibold">
            <FileText :size="18" class="text-[#0D9488]" />
            结果示例
          </div>
          <p class="text-xl font-semibold text-[#0F172A]">
            这里可展示客户业务系统回填的诊断结果
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            class="h-12 rounded-full bg-white border border-[#E5E7EB] text-[#0D9488] font-semibold"
          >
            处方示例
          </button>
          <button
            class="h-12 rounded-full bg-white border border-[#E5E7EB] text-[#334155] font-semibold"
          >
            病历示例
          </button>
        </div>

        <div
          class="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#EEF2F7]"
        >
          <div
            class="bg-gradient-to-r from-[#00C2A8] to-[#0D9488] px-4 py-3 text-white"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold">处方数据示例</h3>
              <span class="text-sm px-3 py-1 rounded-full bg-white/20">可替换</span>
            </div>
            <p class="text-sm mt-2">示例编号：{{ prescriptionNo }}</p>
          </div>
          <div class="p-4">
            <div
              class="border border-[#E5E7EB] rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p class="text-lg font-semibold text-[#111827]">阿莫西林胶囊</p>
                <p class="text-[#6B7280] mt-1">0.5g</p>
              </div>
              <span
                class="px-3 py-1 rounded-full bg-[#F8FAFC] text-[#334155] text-sm"
              >
                21粒
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="sticky bottom-3 mt-4">
        <button
          @click="router.replace('/patient/select-doctor')"
          class="w-full h-12 rounded-full bg-gradient-to-r from-[#00C2A8] to-[#0D9488] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-lg"
        >
          <House :size="18" />
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>
