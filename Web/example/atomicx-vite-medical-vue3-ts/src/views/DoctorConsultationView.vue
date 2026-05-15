<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import {
  ChevronLeft,
  Clock,
  Settings,
  User,
  Phone,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
} from '@/shared/icons';
import {
  FillMode,
  RoomEvent,
  RoomParticipantEvent,
  RoomParticipantView,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
  VideoStreamType,
} from 'tuikit-atomicx-vue3';
import MedicalBusinessPanel from '@/components/MedicalBusinessPanel.vue';
import ConsultationManagePanel from '@/components/ConsultationManagePanel.vue';
import ConsultationVideoStage from '@/features/consultation/components/ConsultationVideoStage.vue';
import { useConsultationParticipants } from '@/features/consultation/useConsultationParticipants';
import { useConsultationPermissions } from '@/features/consultation/useConsultationPermissions';
import { useConsultationDevices } from '@/features/consultation/useConsultationDevices';
import { formatElapsedDuration } from '@/features/consultation/utils';
import type {
  ConsultationCallEvent,
  ConsultationParticipantEvent,
} from '@/features/consultation/types';
import { services } from '@/services/adapters';
import { getSessionUser } from '@/utils/session';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MedicalAlert from '@/components/MedicalAlert.vue';
import MedicalConfirmDialog from '@/components/MedicalConfirmDialog.vue';

type CallStage =
  | 'idle'
  | 'calling'
  | 'accepted'
  | 'rejected'
  | 'timeout'
  | 'cancelled';
const route = useRoute();
const router = useRouter();
const roomState = useRoomState();
const participantState = useRoomParticipantState();
const deviceState = useDeviceState();
const sessionUser = getSessionUser();

const appointment = computed(() =>
  services.appointment.getAppointmentById(String(route.params.appointmentId))
);
const doctor = computed(() =>
  appointment.value
    ? services.user.getDoctorById(appointment.value.doctorId)
    : null
);
const patient = computed(() =>
  appointment.value
    ? services.user.getPatientById(appointment.value.patientId)
    : null
);
const callStage = ref<CallStage>('idle');
const callHint = ref('点击呼叫患者，患者端将收到通知并自动接入');
const isCalling = ref(false);
const isCancellingCall = ref(false);
const deviceAction = ref<'camera' | 'microphone' | ''>('');
const {
  devicePermissionHint,
  getDeviceErrorHint,
  updateDevicePermissionHint,
} = useConsultationDevices();
const finishConfirmVisible = ref(false);
const consultationClosing = ref(false);
const finishTargetPath = ref('/doctor/dashboard');
const elapsedSeconds = ref(0);

const patientJoined = computed(() =>
  participantState.participantList.value.some(
    item => item.userId === patient.value?.userId
  )
);
const localParticipantInfo = computed(
  () => participantState.localParticipant.value
);
const localVideoReady = computed(() =>
  participantState.participantListWithVideo.value.some(
    item => item.userId === localParticipantInfo.value?.userId
  )
);

const isPatientConnected = computed(() => patientJoined.value);
const currentUserId = computed(() => sessionUser?.userId);
const primaryDoctorId = computed(() => appointment.value?.doctorId);
const patientId = computed(() => appointment.value?.patientId);
const { isPrimaryDoctor, permissions: consultationPermissions } =
  useConsultationPermissions({
    currentUserId,
    primaryDoctorId,
  });
const isCallingStage = computed(() => callStage.value === 'calling');
const isErrorStage = computed(() =>
  ['rejected', 'timeout', 'cancelled'].includes(callStage.value)
);
const {
  mainMember: mainVideoMember,
  thumbnailMembers: thumbnailVideoMembers,
  focusParticipant,
} = useConsultationParticipants({
  participantList: participantState.participantList,
  participantListWithVideo: participantState.participantListWithVideo,
  localParticipant: localParticipantInfo,
  primaryDoctorId,
  patientId,
  preferredFocusUserId: patientId,
  getDoctorById: services.user.getDoctorById.bind(services.user),
  getPatientById: services.user.getPatientById.bind(services.user),
});
const mainDisplayName = computed(
  () => mainVideoMember.value?.displayName || patient.value?.userName || '患者'
);
let durationTimer: number | undefined;

function setCallState(stage: CallStage, hint: string) {
  callStage.value = stage;
  callHint.value = hint;
}

async function ensureInRoom() {
  if (!appointment.value) {
    return;
  }
  if (
    !roomState.currentRoom.value ||
    roomState.currentRoom.value.roomId !== appointment.value.roomId
  ) {
    await roomState.joinRoom({ roomId: appointment.value.roomId });
  }
}

async function callPatient() {
  if (
    !appointment.value ||
    !patient.value ||
    isCalling.value ||
    isCancellingCall.value
  ) {
    return;
  }
  isCalling.value = true;
  isCancellingCall.value = false;
  setCallState('calling', `正在连接 ${patient.value.userName}`);
  try {
    await ensureInRoom();
    await roomState.callUserToRoom({
      roomId: appointment.value.roomId,
      userIdList: [patient.value.userId],
      timeout: 30,
      extensionInfo: `${doctor.value?.userName ?? '医生'}邀请您加入视频问诊`,
    });
  } catch (error) {
    setCallState(
      'rejected',
      error instanceof Error ? error.message : '呼叫患者失败'
    );
  } finally {
    isCalling.value = false;
  }
}

async function cancelPatientCall() {
  if (
    !appointment.value ||
    !patient.value ||
    !isCallingStage.value ||
    isCancellingCall.value
  ) {
    return;
  }
  isCancellingCall.value = true;
  try {
    await ensureInRoom();
    await roomState.cancelCall({
      roomId: appointment.value.roomId,
      userIdList: [patient.value.userId],
    });
    setCallState('cancelled', '本次呼叫已取消');
  } catch (error) {
    setCallState(
      'rejected',
      error instanceof Error ? error.message : '取消呼叫失败，请重试'
    );
  } finally {
    isCancellingCall.value = false;
  }
}

async function toggleMic() {
  if (deviceAction.value || consultationClosing.value) {
    return;
  }
  deviceAction.value = 'microphone';
  try {
    if (deviceState.microphoneStatus.value === 1) {
      await deviceState.closeLocalMicrophone();
    } else {
      await deviceState.openLocalMicrophone();
    }
  } catch (error) {
    devicePermissionHint.value = getDeviceErrorHint('麦克风', error);
  } finally {
    deviceAction.value = '';
  }
}

async function toggleCamera() {
  if (deviceAction.value || consultationClosing.value) {
    return;
  }
  deviceAction.value = 'camera';
  try {
    if (deviceState.cameraStatus.value === 1) {
      await deviceState.closeLocalCamera();
    } else {
      await deviceState.openLocalCamera();
    }
  } catch (error) {
    devicePermissionHint.value = getDeviceErrorHint('摄像头', error);
  } finally {
    deviceAction.value = '';
  }
}

async function finishConsultation(targetPath = '/doctor/dashboard') {
  if (consultationClosing.value) {
    return;
  }
  consultationClosing.value = true;
  try {
    await roomState.endRoom();
    await router.replace(targetPath);
  } finally {
    consultationClosing.value = false;
  }
}

function requestFinishConsultation(targetPath = '/doctor/dashboard') {
  if (consultationClosing.value) {
    return;
  }
  finishTargetPath.value = targetPath;
  finishConfirmVisible.value = true;
}

function cancelFinishConsultation() {
  if (consultationClosing.value) {
    return;
  }
  finishConfirmVisible.value = false;
}

async function confirmFinishConsultation() {
  await finishConsultation(finishTargetPath.value);
  finishConfirmVisible.value = false;
}

async function leaveConsultationRoom(targetPath = '/doctor/dashboard') {
  if (consultationClosing.value) {
    return;
  }
  consultationClosing.value = true;
  try {
    await roomState.leaveRoom().catch(() => undefined);
    await router.replace(targetPath);
  } finally {
    consultationClosing.value = false;
  }
}

function handleCallAccepted(eventInfo: ConsultationCallEvent) {
  if (eventInfo.call?.callee?.userId === patient.value?.userId) {
    isCancellingCall.value = false;
    setCallState('accepted', `${patient.value?.userName} 已接听`);
  }
}

function handleCallRejected(eventInfo: ConsultationCallEvent) {
  if (eventInfo.call?.callee?.userId === patient.value?.userId) {
    isCancellingCall.value = false;
    setCallState('rejected', `${patient.value?.userName} 拒绝了问诊邀请`);
  }
}

function handleCallTimeout(eventInfo: ConsultationCallEvent) {
  if (eventInfo.call?.callee?.userId === patient.value?.userId) {
    isCancellingCall.value = false;
    setCallState('timeout', `${patient.value?.userName} 未在规定时间内接听`);
  }
}

function handleCallCancelled(eventInfo: ConsultationCallEvent) {
  if (eventInfo.call?.callee?.userId === patient.value?.userId) {
    isCancellingCall.value = false;
    setCallState('cancelled', '本次呼叫已取消');
  }
}

function handleParticipantJoined(eventInfo: ConsultationParticipantEvent) {
  if (eventInfo?.userInfo?.userId === patient.value?.userId) {
    isCancellingCall.value = false;
    setCallState('accepted', `${patient.value?.userName} 已接入房间`);
  }
}

onMounted(async () => {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== 'doctor' || !appointment.value) {
    router.replace('/login');
    return;
  }

  await ensureInRoom();
  // Synchronize current participant state once after joining room.
  await participantState
    .getParticipantList({ cursor: '' })
    .catch(() => undefined);
  const deviceResults = await Promise.allSettled([
    deviceState.openLocalMicrophone(),
    deviceState.openLocalCamera(),
  ]);
  updateDevicePermissionHint(deviceResults);

  roomState.subscribeEvent(RoomEvent.onCallAccepted, handleCallAccepted);
  roomState.subscribeEvent(RoomEvent.onCallRejected, handleCallRejected);
  roomState.subscribeEvent(RoomEvent.onCallTimeout, handleCallTimeout);
  roomState.subscribeEvent(RoomEvent.onCallCancelled, handleCallCancelled);
  participantState.subscribeEvent(
    RoomParticipantEvent.onParticipantJoined,
    handleParticipantJoined
  );

  durationTimer = window.setInterval(() => {
    if (isPatientConnected.value) {
      elapsedSeconds.value += 1;
    }
  }, 1000);
});

onBeforeUnmount(() => {
  roomState.unsubscribeEvent(RoomEvent.onCallAccepted, handleCallAccepted);
  roomState.unsubscribeEvent(RoomEvent.onCallRejected, handleCallRejected);
  roomState.unsubscribeEvent(RoomEvent.onCallTimeout, handleCallTimeout);
  roomState.unsubscribeEvent(RoomEvent.onCallCancelled, handleCallCancelled);
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onParticipantJoined,
    handleParticipantJoined
  );
  if (durationTimer) {
    window.clearInterval(durationTimer);
  }
});

watch(isPatientConnected, connected => {
  if (connected && callStage.value !== 'accepted') {
    setCallState('accepted', `${patient.value?.userName ?? '患者'} 已接入房间`);
  }
});

onBeforeRouteLeave(to => {
  if (consultationClosing.value || !appointment.value) {
    return true;
  }

  if (isPrimaryDoctor.value) {
    requestFinishConsultation(to.fullPath);
    return false;
  }

  void leaveConsultationRoom(to.fullPath);
  return false;
});
</script>

<template>
  <div
    v-if="appointment && patient && doctor"
    class="h-screen bg-[#F8FAFB] flex flex-col overflow-hidden"
  >
    <header
      class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center gap-4">
        <button
          @click="leaveConsultationRoom()"
          :disabled="consultationClosing"
          class="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LoadingSpinner v-if="consultationClosing" />
          <ChevronLeft v-else :size="20" />
        </button>
        <div class="h-6 w-px bg-gray-200"></div>
        <div>
          <h1 class="font-semibold text-gray-900">视频问诊工作台</h1>
          <p class="text-xs text-gray-500">预约编号：{{ appointment.id }}</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div
          v-if="isPatientConnected"
          class="flex items-center gap-2 bg-[#F1F5F9] px-4 py-2 rounded-xl"
        >
          <Clock :size="16" class="text-[#0D9488]" />
          <span class="font-mono text-sm text-gray-900">{{
            formatElapsedDuration(elapsedSeconds)
          }}</span>
        </div>
        <span
          :class="[
            'px-3 py-1 rounded-full text-sm font-medium',
            isPatientConnected
              ? 'bg-[#10B981] text-white'
              : 'bg-gray-200 text-gray-700',
          ]"
        >
          {{ isPatientConnected ? '通话中' : '等待患者' }}
        </span>
        <div class="h-6 w-px bg-gray-200"></div>
        <button class="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Settings :size="20" class="text-gray-600" />
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 flex gap-6 p-6 overflow-hidden">
      <div class="flex-1 flex flex-col gap-6 min-w-0">
        <div
          class="flex-1 border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 relative"
        >
          <div
            :class="[
              'absolute left-6 z-20 inline-flex items-center gap-2 bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-md',
              isPatientConnected ? 'top-24' : 'top-6',
            ]"
          >
            <span class="flex items-end gap-0.5">
              <i class="inline-block w-1.5 h-3 rounded-full bg-[#00D08A]"></i>
              <i class="inline-block w-1.5 h-4 rounded-full bg-[#00D08A]"></i>
              <i class="inline-block w-1.5 h-5 rounded-full bg-[#00D08A]"></i>
            </span>
            <span class="text-white text-xs leading-none">网络良好</span>
          </div>

          <div
            v-if="devicePermissionHint"
            class="absolute left-6 right-6 top-16 z-30"
          >
            <MedicalAlert variant="warning">
              {{ devicePermissionHint }}
            </MedicalAlert>
          </div>

          <template v-if="!isPatientConnected">
            <div class="absolute inset-0 bg-[#0F1F38]">
              <RoomParticipantView
                v-if="localParticipantInfo"
                class="absolute inset-0"
                :participant="localParticipantInfo"
                :stream-type="VideoStreamType.Camera"
                :fill-mode="FillMode.Fit"
              />
            </div>

            <div
              class="absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-black/25 to-black/50"
            ></div>

            <div
              class="absolute top-6 right-6 z-20 rounded-2xl bg-black/35 backdrop-blur-md px-4 py-2.5"
            >
              <p class="text-sm font-semibold text-white leading-none">
                {{ patient.userName }}
              </p>
              <p class="mt-1.5 text-xs leading-none text-white/80">
                {{ appointment.patientGender }} · {{ appointment.patientAge }}岁
              </p>
            </div>

            <div class="absolute inset-0 z-20 flex items-center justify-center">
              <div class="text-center pointer-events-none">
                <div
                  class="w-32 h-32 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] mx-auto flex items-center justify-center mb-5 shadow-2xl relative"
                >
                  <User :size="62" class="text-white" />
                  <div
                    v-if="isCallingStage"
                    class="absolute inset-0 rounded-full border-4 border-[#10B981] animate-ping opacity-70"
                  ></div>
                </div>
                <h3 class="text-[36px] leading-none font-semibold text-white">
                  {{ patient.userName }}
                </h3>
                <p class="mt-3 text-[20px] leading-none text-white/70">
                  {{ isCallingStage ? '正在呼叫患者...' : '待接诊患者' }}
                </p>
                <p
                  v-if="!localVideoReady"
                  class="mt-3 text-xs text-amber-200/90"
                >
                  摄像头已关闭，可点击左下角按钮开启预览
                </p>
              </div>
            </div>

            <div
              class="absolute left-8 bottom-8 z-20 flex items-center gap-3 rounded-2xl bg-black/35 backdrop-blur-md px-3 py-3"
            >
              <button
                @click="toggleCamera"
                :disabled="!!deviceAction || consultationClosing"
                :class="[
                  'w-12 h-12 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  deviceState.cameraStatus.value === 1
                    ? 'bg-[#334155]/90 hover:bg-[#475569]'
                    : 'bg-red-500/80 hover:bg-red-500',
                ]"
              >
                <LoadingSpinner
                  v-if="deviceAction === 'camera'"
                  class="mx-auto text-white"
                />
                <component
                  v-else
                  :is="
                    deviceState.cameraStatus.value === 1 ? Camera : CameraOff
                  "
                  :size="20"
                  class="mx-auto text-white"
                />
              </button>
              <button
                @click="toggleMic"
                :disabled="!!deviceAction || consultationClosing"
                :class="[
                  'w-12 h-12 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  deviceState.microphoneStatus.value === 1
                    ? 'bg-[#334155]/90 hover:bg-[#475569]'
                    : 'bg-red-500/80 hover:bg-red-500',
                ]"
              >
                <LoadingSpinner
                  v-if="deviceAction === 'microphone'"
                  class="mx-auto text-white"
                />
                <component
                  v-else
                  :is="deviceState.microphoneStatus.value === 1 ? Mic : MicOff"
                  :size="20"
                  class="mx-auto text-white"
                />
              </button>
            </div>

            <div
              v-if="isPrimaryDoctor"
              class="absolute left-1/2 bottom-8 -translate-x-1/2 z-20 text-center"
            >
              <div
                class="inline-flex items-center gap-3 rounded-2xl bg-black/35 backdrop-blur-md px-4 py-3"
              >
                <button
                  @click="callPatient"
                  :disabled="isCalling || isCallingStage || isCancellingCall"
                  class="bg-gradient-to-r from-[#10B981] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white h-12 px-7 rounded-xl text-lg font-semibold gap-2 shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                >
                  <Phone :size="20" />
                  {{ isCallingStage ? '呼叫中...' : '呼叫患者' }}
                </button>
                <button
                  v-if="isCallingStage"
                  @click="cancelPatientCall"
                  :disabled="isCancellingCall"
                  class="h-12 px-5 rounded-xl border border-red-300 text-red-200 hover:bg-red-500/10 transition-colors text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <LoadingSpinner v-if="isCancellingCall" />
                  {{ isCancellingCall ? '取消中...' : '取消呼叫' }}
                </button>
              </div>
              <p class="mt-3 text-sm text-white/65">
                {{
                  isCallingStage
                    ? '患者正在响应并自动接入'
                    : '点击呼叫患者，患者端将收到通知并自动接入'
                }}
              </p>
              <p v-if="isErrorStage" class="text-sm text-red-300 mt-2">
                {{ callHint }}
              </p>
            </div>
            <p
              v-else
              class="absolute left-1/2 bottom-10 -translate-x-1/2 z-20 rounded-2xl bg-black/35 px-4 py-3 text-sm text-white/75 backdrop-blur-md"
            >
              等待主治医生呼叫患者
            </p>
          </template>

          <template v-else>
            <ConsultationVideoStage
              :main-member="mainVideoMember"
              :thumbnail-members="thumbnailVideoMembers"
              thumbnail-list-class="top-6 right-6 max-h-[calc(100%-150px)] w-56"
              thumbnail-card-class="h-36"
              @focus="focusParticipant"
            />

            <div
              class="absolute top-6 left-6 bg-black/40 backdrop-blur-md text-white px-6 py-3 rounded-2xl"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center text-white font-medium"
                >
                  {{ mainVideoMember?.avatarText || '患' }}
                </div>
                <div>
                  <p class="font-medium">{{ mainDisplayName }}</p>
                  <p class="text-xs text-white/70">
                    {{ mainVideoMember?.roleLabel }}
                  </p>
                </div>
              </div>
            </div>

            <div
              class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl"
            >
              <button
                @click="toggleMic"
                :disabled="!!deviceAction || consultationClosing"
                :class="[
                  'w-14 h-14 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  deviceState.microphoneStatus.value === 1
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-500 hover:bg-red-600',
                ]"
              >
                <LoadingSpinner
                  v-if="deviceAction === 'microphone'"
                  class="mx-auto text-white"
                />
                <component
                  v-else
                  :is="deviceState.microphoneStatus.value === 1 ? Mic : MicOff"
                  :size="24"
                  class="mx-auto text-white"
                />
              </button>
              <button
                @click="toggleCamera"
                :disabled="!!deviceAction || consultationClosing"
                :class="[
                  'w-14 h-14 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  deviceState.cameraStatus.value === 1
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-500 hover:bg-red-600',
                ]"
              >
                <LoadingSpinner
                  v-if="deviceAction === 'camera'"
                  class="mx-auto text-white"
                />
                <component
                  v-else
                  :is="
                    deviceState.cameraStatus.value === 1 ? Camera : CameraOff
                  "
                  :size="24"
                  class="mx-auto text-white"
                />
              </button>
              <button
                @click="
                  isPrimaryDoctor
                    ? requestFinishConsultation()
                    : leaveConsultationRoom()
                "
                :disabled="consultationClosing"
                class="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LoadingSpinner
                  v-if="consultationClosing"
                  class="mx-auto text-white"
                />
                <PhoneOff v-else :size="24" class="mx-auto text-white" />
              </button>
            </div>
          </template>
        </div>

        <div
          class="p-6 bg-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl"
        >
          <div class="grid grid-cols-4 gap-6">
            <div>
              <p class="text-xs text-gray-500 mb-1">主诉</p>
              <p class="text-sm text-gray-900 font-medium">
                {{ appointment.chiefComplaint }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">过敏史</p>
              <p class="text-sm text-red-600 font-medium">
                {{ appointment.allergyHistory }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">既往病史</p>
              <p class="text-sm text-gray-900">
                {{ appointment.medicalHistory }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">联系电话</p>
              <p class="text-sm text-gray-900 font-mono">
                {{ appointment.patientPhone }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        :class="[
          'h-full min-h-0 shrink-0 flex gap-4',
          isPrimaryDoctor ? 'w-[860px]' : 'w-[360px]',
        ]"
      >
        <div v-if="isPrimaryDoctor" class="flex-1 min-w-0">
          <MedicalBusinessPanel :appointment="appointment" :patient="patient" />
        </div>
        <div class="w-[320px] min-w-0">
          <ConsultationManagePanel
            :doctor="doctor"
            :patient="patient"
            :permissions="consultationPermissions"
          />
        </div>
      </div>
    </div>

    <MedicalConfirmDialog
      :visible="finishConfirmVisible"
      title="确认结束问诊？"
      message="结束后患者会离开当前视频问诊，并进入问诊完成页。请确认诊疗内容已沟通完成。"
      cancel-text="继续问诊"
      confirm-text="确认结束"
      :loading="consultationClosing"
      danger
      @cancel="cancelFinishConsultation"
      @confirm="confirmFinishConsultation"
    />
  </div>
</template>
