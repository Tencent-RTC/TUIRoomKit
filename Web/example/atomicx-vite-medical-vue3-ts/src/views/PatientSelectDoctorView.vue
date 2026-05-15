<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Award,
  Search,
  Star,
  Stethoscope,
  ThumbsUp,
  Video,
  LogOut,
} from '@/shared/icons';
import { useLoginState } from 'tuikit-atomicx-vue3';
import { services } from '@/services/adapters';
import { clearSession, getSessionUser } from '@/utils/session';
import MedicalButton from '@/components/MedicalButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const loginState = useLoginState();
const patient = computed(() => getSessionUser());
const searchQuery = ref('');
const selectingAppointmentId = ref('');
const loggingOut = ref(false);

const avatarGradientMap: Record<string, string> = {
  doctor_li: 'from-[#0D9488] to-[#0F766E]',
  doctor_wang: 'from-[#3B82F6] to-[#2563EB]',
  doctor_zhang: 'from-[#8B5CF6] to-[#7C3AED]',
};

const rawCards = computed(() => {
  if (!patient.value) {
    return [];
  }
  return services.appointment
    .getAppointmentsByPatient(patient.value.userId)
    .map(appointment => {
      const doctor = services.user.getDoctorById(appointment.doctorId);
      return {
        appointment,
        doctor,
        status: doctor?.status ?? 'online',
      };
    });
});

const doctorCards = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  return rawCards.value.filter(item => {
    if (!keyword) {
      return true;
    }
    const haystack = [
      item.doctor?.userName,
      item.doctor?.title,
      item.doctor?.department,
      item.doctor?.hospital,
      ...(item.doctor?.tags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
});

function formatConsultations(value?: string) {
  if (!value) {
    return '-';
  }
  const raw = Number(value.replace(/,/g, ''));
  if (Number.isNaN(raw)) {
    return value;
  }
  return raw.toLocaleString('en-US');
}

async function selectDoctor(appointmentId: string) {
  if (selectingAppointmentId.value) {
    return;
  }
  selectingAppointmentId.value = appointmentId;
  try {
    await router.push(`/patient/waiting/${appointmentId}`);
  } finally {
    selectingAppointmentId.value = '';
  }
}

async function logout() {
  if (loggingOut.value) {
    return;
  }
  loggingOut.value = true;
  try {
    await loginState.logout();
    clearSession();
    await router.replace('/login');
  } finally {
    loggingOut.value = false;
  }
}

onMounted(() => {
  if (!patient.value || patient.value.role !== 'patient') {
    router.replace('/login');
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-[#F8FAFB] to-[#E0F2F1]">
    <div class="mx-auto w-full max-w-md">
      <div class="bg-gradient-to-r from-[#0D9488] to-[#0F766E] pt-safe">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3 min-w-0">
              <div class="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <Stethoscope class="w-6 h-6 text-white" />
              </div>
              <div class="text-white min-w-0">
                <h1 class="text-lg font-semibold leading-none truncate">
                  示例医疗平台
                </h1>
                <p class="text-xs text-white/80 mt-1">选择医生开始问诊</p>
              </div>
            </div>
            <button
              type="button"
              @click="logout"
              :disabled="loggingOut"
              class="w-9 h-9 rounded-xl bg-white/15 text-white hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors shrink-0"
              aria-label="退出登录"
            >
              <LoadingSpinner v-if="loggingOut" />
              <LogOut v-else class="w-4 h-4" />
            </button>
          </div>

          <div class="relative">
            <Search
              :size="20"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索医生、科室或疾病"
              class="w-full h-11 pl-11 pr-4 rounded-xl bg-white border-none shadow-sm text-[15px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-white/60"
            />
          </div>
        </div>
      </div>

      <div class="px-4 py-4 space-y-3 pb-safe">
        <div
          v-for="item in doctorCards"
          :key="item.appointment.id"
          class="border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden bg-white"
        >
          <div class="p-4">
            <div class="flex items-start gap-3 mb-3">
              <div class="relative shrink-0">
                <div
                  :class="[
                    'w-16 h-16 rounded-full ring-2 ring-gray-100 bg-gradient-to-br text-white text-xl font-semibold flex items-center justify-center',
                    avatarGradientMap[item.doctor?.userId ?? 'doctor_li'],
                  ]"
                >
                  {{ item.doctor?.userName?.charAt(0) }}
                </div>
                <div
                  v-if="item.status === 'online'"
                  class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center"
                >
                  <div class="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-gray-900 text-lg leading-none">
                    {{ item.doctor?.userName }}
                  </h3>
                  <span
                    class="bg-[#0D9488]/10 text-[#0D9488] px-2 py-0 h-5 rounded-full text-xs font-medium inline-flex items-center"
                  >
                    {{ item.status === 'online' ? '在线' : '忙碌' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-1 leading-none">
                  {{ item.doctor?.title }} · {{ item.doctor?.department }}
                </p>
                <p class="text-xs text-gray-500 leading-none">
                  {{ item.doctor?.hospital }}
                </p>
              </div>

              <div class="text-right shrink-0">
                <div class="flex items-center justify-end gap-1 mb-1">
                  <Star class="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span
                    class="text-sm leading-none font-semibold text-gray-900"
                  >
                    {{ item.doctor?.rating }}%
                  </span>
                </div>
                <p class="text-xs leading-none text-gray-500">满意度</p>
              </div>
            </div>

            <div class="flex gap-2 mb-3 flex-wrap">
              <span
                v-for="tag in item.doctor?.tags ?? []"
                :key="tag"
                class="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs leading-none"
              >
                {{ tag }}
              </span>
            </div>

            <div
              class="flex items-center gap-4 mb-4 py-3 px-4 bg-gray-50 rounded-xl"
            >
              <div class="flex items-center gap-2">
                <Award class="w-4 h-4 text-[#0D9488]" />
                <div>
                  <p class="text-xs leading-none text-gray-500 mb-1">
                    从医经验
                  </p>
                  <p class="text-sm leading-none font-semibold text-gray-900">
                    {{ item.doctor?.experience }}
                  </p>
                </div>
              </div>
              <div class="w-px h-8 bg-gray-200"></div>
              <div class="flex items-center gap-2">
                <ThumbsUp class="w-4 h-4 text-[#0D9488]" />
                <div>
                  <p class="text-xs leading-none text-gray-500 mb-1">
                    接诊人次
                  </p>
                  <p class="text-sm leading-none font-semibold text-gray-900">
                    {{ formatConsultations(item.doctor?.consultations) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs leading-none text-gray-500 mb-1">视频问诊</p>
                <div class="flex items-end gap-1">
                  <span
                    class="text-2xl leading-none font-semibold text-[#0D9488]"
                  >
                    ¥{{ item.doctor?.price }}
                  </span>
                  <span class="text-xs leading-none text-gray-500 mb-1">
                    /次
                  </span>
                </div>
              </div>
              <MedicalButton
                @click="selectDoctor(item.appointment.id)"
                :disabled="!!selectingAppointmentId"
                :loading="selectingAppointmentId === item.appointment.id"
                class="shadow-lg shadow-teal-500/20"
              >
                <Video
                  v-if="selectingAppointmentId !== item.appointment.id"
                  class="w-4 h-4"
                />
                {{
                  selectingAppointmentId === item.appointment.id
                    ? '进入中...'
                    : '立即问诊'
                }}
              </MedicalButton>
            </div>
          </div>
        </div>
      </div>

      <div
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-3 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      >
        <div
          class="flex items-center justify-center gap-2 text-xs text-gray-500"
        >
          <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span>音视频链路加密 · 医疗场景接入模板</span>
        </div>
      </div>
    </div>
  </div>
</template>
