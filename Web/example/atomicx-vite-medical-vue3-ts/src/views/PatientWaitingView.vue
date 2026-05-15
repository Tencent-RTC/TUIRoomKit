<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Activity,
  CheckCircle2,
  FileText,
  Phone,
  Shield,
  Stethoscope,
  Video,
  X,
} from '@/shared/icons';
import { RoomEvent, useRoomState } from 'tuikit-atomicx-vue3';
import { services } from '@/services/adapters';
import { formatTimeRange } from '@/utils/format';
import { getSessionUser } from '@/utils/session';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MedicalButton from '@/components/MedicalButton.vue';

const route = useRoute();
const router = useRouter();
const roomState = useRoomState();

const joining = ref(false);
const rejecting = ref(false);
const returning = ref(false);
const incomingCall = ref(false);
const callMessage = ref('医生暂未发起呼叫，请保持页面停留。');

const appointment = computed(() =>
  services.appointment.getAppointmentById(String(route.params.appointmentId))
);
const doctor = computed(() =>
  appointment.value
    ? services.user.getDoctorById(appointment.value.doctorId)
    : null
);
const appointmentTime = computed(() => {
  if (!appointment.value) {
    return '-';
  }
  return formatTimeRange(
    appointment.value.scheduleStartTime,
    appointment.value.scheduleEndTime
  );
});

async function acceptIncomingCall() {
  if (!appointment.value || joining.value || rejecting.value) {
    return;
  }
  joining.value = true;
  try {
    if (incomingCall.value) {
      try {
        await roomState.acceptCall({ roomId: appointment.value.roomId });
      } catch {
        await roomState.joinRoom({ roomId: appointment.value.roomId });
      }
    } else {
      await roomState.joinRoom({ roomId: appointment.value.roomId });
    }
    router.push(`/patient/consultation/${appointment.value.id}`);
    callMessage.value = '';
  } catch (error) {
    callMessage.value =
      error instanceof Error ? error.message : '接入问诊失败，请重试。';
  } finally {
    joining.value = false;
  }
}

async function rejectIncomingCall() {
  if (!appointment.value || joining.value || rejecting.value) {
    return;
  }
  rejecting.value = true;
  try {
    await roomState
      .rejectCall({ roomId: appointment.value.roomId })
      .catch(() => undefined);
    incomingCall.value = false;
    callMessage.value = '你已暂不接听本次呼叫，请等待医生再次发起。';
  } finally {
    rejecting.value = false;
  }
}

async function returnToDoctorList() {
  if (returning.value) {
    return;
  }
  returning.value = true;
  try {
    await router.replace('/patient/select-doctor');
  } finally {
    returning.value = false;
  }
}

function handleCallReceived(eventInfo: any) {
  if (eventInfo.roomInfo?.roomId !== appointment.value?.roomId) {
    return;
  }
  incomingCall.value = true;
  callMessage.value =
    eventInfo.extensionInfo || `${doctor.value?.userName} 正在呼叫你加入问诊。`;
}

function handleCallCancelled(eventInfo: any) {
  if (eventInfo.roomInfo?.roomId !== appointment.value?.roomId) {
    return;
  }
  incomingCall.value = false;
  callMessage.value = '医生已取消本次呼叫。';
}

function handleCallTimeout(eventInfo: any) {
  if (eventInfo.roomInfo?.roomId !== appointment.value?.roomId) {
    return;
  }
  incomingCall.value = false;
  callMessage.value = '本次呼叫已超时，请等待医生重新发起。';
}

onMounted(async () => {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== 'patient' || !appointment.value) {
    router.replace('/login');
    return;
  }

  await roomState.getScheduledRoomList({ cursor: '' }).catch(() => undefined);
  roomState.subscribeEvent(RoomEvent.onCallReceived, handleCallReceived);
  roomState.subscribeEvent(RoomEvent.onCallCancelled, handleCallCancelled);
  roomState.subscribeEvent(RoomEvent.onCallTimeout, handleCallTimeout);
});

onBeforeUnmount(() => {
  roomState.unsubscribeEvent(RoomEvent.onCallReceived, handleCallReceived);
  roomState.unsubscribeEvent(RoomEvent.onCallCancelled, handleCallCancelled);
  roomState.unsubscribeEvent(RoomEvent.onCallTimeout, handleCallTimeout);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="incomingCall && appointment && doctor"
      class="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm border-none shadow-2xl rounded-3xl overflow-hidden bg-white animate-in fade-in zoom-in duration-300 relative"
      >
        <button
          @click="rejectIncomingCall"
          :disabled="rejecting || joining"
          class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="rejecting" class="text-white" />
          <X v-else class="w-5 h-5 text-white" />
        </button>

        <div
          class="bg-gradient-to-r from-[#10B981] to-[#0D9488] p-6 text-center"
        >
          <div class="relative inline-block mb-4">
            <div
              class="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto"
            >
              <Phone class="w-12 h-12 text-white" />
            </div>
            <div
              class="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"
            ></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-white/30"
            ></div>
          </div>
          <h3 class="text-2xl font-semibold text-white mb-2">医生正在呼叫</h3>
          <p class="text-white/90 text-sm">
            {{ doctor.userName }} 邀请您进入视频问诊
          </p>
        </div>
        <div class="p-6 bg-white">
          <div class="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white flex items-center justify-center text-lg font-semibold"
            >
              {{ doctor.userName.slice(0, 1) }}
            </div>
            <div>
              <p class="font-semibold text-gray-900">{{ doctor.userName }}</p>
              <p class="text-sm text-gray-500">
                {{ doctor.department }} · {{ doctor.title }}
              </p>
            </div>
          </div>
          <div class="flex gap-3">
            <MedicalButton
              @click="rejectIncomingCall"
              :disabled="rejecting || joining"
              :loading="rejecting"
              variant="outline"
              size="lg"
              class="flex-1"
            >
              {{ rejecting ? '处理中...' : '稍后接入' }}
            </MedicalButton>
            <MedicalButton
              @click="acceptIncomingCall"
              :loading="joining"
              size="lg"
              class="flex-1 bg-gradient-to-r from-medical-success to-primary hover:from-primary hover:to-primary-hover shadow-lg shadow-emerald-500/30"
            >
              <Video v-if="!joining" class="w-5 h-5" />
              {{ joining ? '接入中...' : '立即接入' }}
            </MedicalButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <div
    v-if="appointment && doctor"
    class="min-h-screen bg-gradient-to-b from-[#F8FAFB] to-[#E0F2F1]"
  >
    <div class="bg-gradient-to-r from-[#0D9488] to-[#0F766E] pt-safe">
      <div class="px-4 py-4 text-white">
        <div class="flex items-center gap-3 mb-2">
          <div class="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
            <Stethoscope class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-semibold text-2xl leading-none">示例医疗平台</h1>
            <p class="text-xs text-white/80 mt-1">视频问诊候诊中</p>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 py-4 space-y-4 pb-safe">
      <div
        class="border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl bg-white overflow-hidden"
      >
        <div class="p-6 text-center">
          <div class="relative inline-block mb-6">
            <div class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-40 h-40 rounded-full bg-[#0D9488]/5 animate-pulse"
              ></div>
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center animate-spin"
              style="animation-duration: 4s"
            >
              <svg class="w-36 h-36" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#waiting-ring-gradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-dasharray="70 200"
                />
                <defs>
                  <linearGradient
                    id="waiting-ring-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stop-color="#0D9488" stop-opacity="0.8" />
                    <stop
                      offset="100%"
                      stop-color="#10B981"
                      stop-opacity="0.3"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div
              class="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20"
            >
              <Stethoscope class="w-14 h-14 text-white animate-pulse" />
            </div>
          </div>

          <h2 class="text-2xl font-semibold text-gray-900 mb-2">候诊中</h2>
          <p class="text-gray-600 mb-6 text-base leading-7">
            请保持页面停留，医生准备好后将发起视频呼叫。
          </p>

          <div
            class="inline-flex items-center gap-4 bg-gradient-to-r from-[#F0FDFA] to-white px-6 py-4 rounded-2xl shadow-sm border border-[#0D9488]/10"
          >
            <div
              class="w-12 h-12 rounded-full ring-2 ring-[#0D9488]/20 bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white flex items-center justify-center text-lg font-semibold"
            >
              {{ doctor.userName.slice(0, 1) }}
            </div>
            <div class="text-left">
              <p class="font-semibold text-gray-900">{{ doctor.userName }}</p>
              <p class="text-sm text-gray-500">
                {{ doctor.department }} · {{ doctor.title }}
              </p>
            </div>
            <span
              class="bg-emerald-500/10 text-emerald-700 shrink-0 ml-2 px-2.5 py-1 rounded-full text-xs font-medium"
            >
              在线
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-4">{{ callMessage }}</p>
        </div>

        <div class="h-px bg-gray-100"></div>

        <div class="p-6 bg-gray-50">
          <h3 class="font-medium text-gray-900 mb-4 text-sm">问诊流程</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md"
              >
                <CheckCircle2 class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1 pt-1">
                <p class="font-medium text-gray-900 text-sm">1. 预约成功</p>
                <p class="text-xs text-gray-500 mt-0.5">已选择医生并提交预约</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center shrink-0 shadow-md"
              >
                <Activity class="w-5 h-5 text-white animate-pulse" />
              </div>
              <div class="flex-1 pt-1">
                <p class="font-medium text-[#0D9488] text-sm">
                  2. 等待接诊（当前）
                </p>
                <p class="text-xs text-gray-500 mt-0.5">医生将很快接入视频</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"
              >
                <Video class="w-5 h-5 text-gray-400" />
              </div>
              <div class="flex-1 pt-1">
                <p class="text-sm text-gray-400">3. 视频问诊</p>
                <p class="text-xs text-gray-400 mt-0.5">与医生面对面交流</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"
              >
                <FileText class="w-5 h-5 text-gray-400" />
              </div>
              <div class="flex-1 pt-1">
                <p class="text-sm text-gray-400">4. 获取处方</p>
                <p class="text-xs text-gray-400 mt-0.5">医生开具电子处方</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl bg-white"
      >
        <div class="p-5">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText class="w-4 h-4 text-[#0D9488]" />
            预约详情
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-500">预约时间</span>
              <span class="text-sm font-medium text-gray-900">{{
                appointmentTime
              }}</span>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-500">预约编号</span>
              <span class="text-sm font-mono font-medium text-gray-900">{{
                appointment.id
              }}</span>
            </div>
            <div class="h-px bg-gray-100"></div>
            <div class="py-2">
              <span class="text-sm text-gray-500 block mb-2">主诉症状</span>
              <p class="text-sm text-gray-900 bg-gray-50 p-3 rounded-xl">
                {{ appointment.chiefComplaint }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="border-none shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500"
      >
        <div class="p-5">
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"
            >
              <Shield class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 mb-2 text-sm">温馨提示</h4>
              <ul class="text-xs text-gray-600 space-y-1.5 leading-relaxed">
                <li>• 请保持手机网络畅通，医生接诊时会自动进入视频</li>
                <li>• 建议准备好既往病历、检查报告等资料</li>
                <li>• 请在安静、光线充足的环境中进行视频问诊</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <MedicalButton
        v-if="!incomingCall"
        @click="returnToDoctorList"
        :loading="returning"
        variant="outline"
        size="lg"
        block
      >
        {{ returning ? '返回中...' : '返回医生列表' }}
      </MedicalButton>
    </div>
  </div>
</template>
