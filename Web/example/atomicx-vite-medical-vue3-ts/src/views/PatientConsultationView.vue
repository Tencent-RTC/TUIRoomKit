<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
  Volume2,
  VolumeX,
  MessageCircle,
  FileText,
  ChevronDown,
  Clock,
  Send,
  X,
} from '@/shared/icons';
import {
  useAITranscriberState,
  DeviceType,
  RoomEvent,
  RoomParticipantEvent,
  useDeviceState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3';
import ConsultationVideoStage from '@/features/consultation/components/ConsultationVideoStage.vue';
import { useConsultationParticipants } from '@/features/consultation/useConsultationParticipants';
import { useConsultationChat } from '@/features/consultation/useConsultationChat';
import { useConsultationDevices } from '@/features/consultation/useConsultationDevices';
import {
  formatConsultationClock,
  getConsultationMessageText,
  normalizeConsultationTimestamp,
} from '@/features/consultation/utils';
import type { ConsultationCallEvent } from '@/features/consultation/types';
import { services } from '@/services/adapters';
import { getSessionUser } from '@/utils/session';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MedicalAlert from '@/components/MedicalAlert.vue';

const route = useRoute();
const router = useRouter();
const roomState = useRoomState();
const participantState = useRoomParticipantState();
const deviceState = useDeviceState();
const { realtimeMessageList } = useAITranscriberState();

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

const localParticipantInfo = computed(
  () => participantState.localParticipant.value
);

const primaryDoctorId = computed(() => appointment.value?.doctorId);
const patientId = computed(() => appointment.value?.patientId);
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
  preferredFocusUserId: primaryDoctorId,
  getDoctorById: services.user.getDoctorById.bind(services.user),
  getPatientById: services.user.getPatientById.bind(services.user),
  selfDisplayName: '我',
});
const timer = ref(0);
const consultationSessionStartedAt = ref(Date.now());
const speakerEnabled = ref(true);
const endingByDoctor = ref(false);
const leavingConsultation = ref(false);
const deviceAction = ref<'camera' | 'microphone' | ''>('');
const chatPanelVisible = ref(false);
const transcriptionPanelVisible = ref(false);
const chatContainerRef = ref<HTMLElement | null>(null);
const transcriptionContainerRef = ref<HTMLElement | null>(null);
const seenTranscriptionCount = ref(0);
const deviceInviteVisible = ref(false);
const deviceInviteLoading = ref(false);
const deviceInviteDecision = ref<'accept' | 'decline' | ''>('');
const deviceInviteHint = ref('');
const {
  devicePermissionHint,
  getDeviceErrorHint,
  updateDevicePermissionHint,
} = useConsultationDevices();
const pendingDeviceInvitation = ref<{
  senderUserId: string;
  senderName: string;
  deviceType: DeviceType;
} | null>(null);
let timerInterval: number | null = null;
let clearingSession = false;

const doctorUserId = computed(() => doctor.value?.userId);
const {
  activeConversation,
  chatInput,
  chatError,
  isSendingMessage,
  chatMessages,
  ensureChatConversation,
  handleSendMessage,
  clearChatConversation,
} = useConsultationChat({
  peerUserId: doctorUserId,
  sessionStartedAt: consultationSessionStartedAt,
  emptyErrorText: '会话初始化失败',
});
const transcriptionMessages = computed(() =>
  [...(realtimeMessageList.value ?? [])]
    .filter(
      item =>
        normalizeConsultationTimestamp(item.timestamp) >=
        consultationSessionStartedAt.value
    )
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-120)
);
const transcriptionUnreadCount = computed(() =>
  Math.max(0, transcriptionMessages.value.length - seenTranscriptionCount.value)
);
const transcriptionUnreadText = computed(() => {
  if (transcriptionUnreadCount.value <= 0) {
    return '';
  }
  return transcriptionUnreadCount.value > 99
    ? '99+'
    : String(transcriptionUnreadCount.value);
});

const formattedTimer = computed(() => {
  const mins = Math.floor(timer.value / 60);
  const secs = timer.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

async function clearConsultationSession(options: { leaveRoom?: boolean } = {}) {
  if (clearingSession) {
    return;
  }
  clearingSession = true;
  try {
    chatPanelVisible.value = false;
    transcriptionPanelVisible.value = false;
    seenTranscriptionCount.value = 0;
    deviceInviteVisible.value = false;
    deviceInviteLoading.value = false;
    deviceInviteDecision.value = '';
    devicePermissionHint.value = '';
    pendingDeviceInvitation.value = null;
    if (options.leaveRoom) {
      await roomState.leaveRoom().catch(() => undefined);
    }
    await clearChatConversation();
  } finally {
    clearingSession = false;
  }
}

async function jumpToFinishedPage() {
  if (!appointment.value || endingByDoctor.value) {
    return;
  }
  endingByDoctor.value = true;
  await clearConsultationSession({ leaveRoom: true });
  router.replace({
    path: `/patient/consultation-finished/${appointment.value.id}`,
    query: { duration: String(timer.value) },
  });
}

function handleRoomEnded(eventInfo: ConsultationCallEvent) {
  if (eventInfo?.roomInfo?.roomId !== appointment.value?.roomId) {
    return;
  }
  void jumpToFinishedPage();
}

async function leaveConsultation() {
  await leaveConsultationTo(`/patient/waiting/${route.params.appointmentId}`);
}

async function leaveConsultationTo(targetPath: string) {
  if (leavingConsultation.value || endingByDoctor.value) {
    return;
  }
  leavingConsultation.value = true;
  try {
    await clearConsultationSession({ leaveRoom: true });
    await router.replace(targetPath);
  } finally {
    leavingConsultation.value = false;
  }
}

async function ensureJoined() {
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

function formatMessageTime(timestamp?: number) {
  return formatConsultationClock(timestamp, false);
}

function scrollChatToBottom() {
  if (!chatContainerRef.value) {
    return;
  }
  chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
}

function scrollTranscriptionToBottom() {
  if (!transcriptionContainerRef.value) {
    return;
  }
  transcriptionContainerRef.value.scrollTop =
    transcriptionContainerRef.value.scrollHeight;
}

function isPatientSpeaker(userId?: string) {
  if (!userId) {
    return false;
  }
  return (
    userId === patient.value?.userId ||
    userId === localParticipantInfo.value?.userId
  );
}

function getTranscriptionSpeakerName(userId?: string) {
  if (!userId) {
    return '成员';
  }
  if (userId === doctor.value?.userId) {
    return doctor.value?.userName || '医生';
  }
  if (isPatientSpeaker(userId)) {
    return '我';
  }
  return '成员';
}

function formatTranscriptionTime(timestamp?: number) {
  return formatConsultationClock(timestamp, false);
}

function closeTranscriptionPanel() {
  transcriptionPanelVisible.value = false;
}

async function toggleTranscriptionPanel() {
  const nextVisible = !transcriptionPanelVisible.value;
  transcriptionPanelVisible.value = nextVisible;
  if (nextVisible) {
    chatPanelVisible.value = false;
    seenTranscriptionCount.value = transcriptionMessages.value.length;
    await nextTick();
    scrollTranscriptionToBottom();
  }
}

function toggleChatPanel() {
  const nextVisible = !chatPanelVisible.value;
  chatPanelVisible.value = nextVisible;
  if (nextVisible) {
    transcriptionPanelVisible.value = false;
  }
}

function getDeviceLabel(deviceType: DeviceType) {
  return deviceType === DeviceType.Camera ? '摄像头' : '麦克风';
}

const deviceInviteTitle = computed(() => {
  if (!pendingDeviceInvitation.value) {
    return '';
  }
  return `${pendingDeviceInvitation.value.senderName}邀请你开启${getDeviceLabel(pendingDeviceInvitation.value.deviceType)}`;
});

const onDeviceInvitationReceived = (options: {
  invitation: {
    senderUserId: string;
    senderUserName: string;
    deviceType: DeviceType;
  };
}) => {
  const { invitation } = options;
  if (invitation.senderUserId !== doctor.value?.userId) {
    return;
  }
  pendingDeviceInvitation.value = {
    senderUserId: invitation.senderUserId,
    senderName: invitation.senderUserName || doctor.value?.userName || '医生',
    deviceType: invitation.deviceType,
  };
  deviceInviteHint.value = '';
  deviceInviteVisible.value = true;
};

function isCurrentPendingInvitation(options: {
  invitation: { senderUserId: string; deviceType: DeviceType };
}) {
  if (!pendingDeviceInvitation.value) {
    return false;
  }
  return (
    options.invitation.senderUserId ===
      pendingDeviceInvitation.value.senderUserId &&
    options.invitation.deviceType === pendingDeviceInvitation.value.deviceType
  );
}

const onDeviceInvitationCancelled = (options: {
  invitation: { senderUserId: string; deviceType: DeviceType };
}) => {
  if (!isCurrentPendingInvitation(options)) {
    return;
  }
  deviceInviteHint.value = '该邀请已被取消';
  deviceInviteVisible.value = false;
  pendingDeviceInvitation.value = null;
};

const onDeviceInvitationTimeout = (options: {
  invitation: { senderUserId: string; deviceType: DeviceType };
}) => {
  if (!isCurrentPendingInvitation(options)) {
    return;
  }
  deviceInviteHint.value = '该邀请已超时';
  deviceInviteVisible.value = false;
  pendingDeviceInvitation.value = null;
};

async function handleDeviceInvitationDecision(accept: boolean) {
  if (!pendingDeviceInvitation.value || deviceInviteLoading.value) {
    return;
  }
  const invitation = pendingDeviceInvitation.value;
  deviceInviteLoading.value = true;
  deviceInviteDecision.value = accept ? 'accept' : 'decline';
  try {
    if (accept) {
      await participantState.acceptOpenDeviceInvitation({
        userId: invitation.senderUserId,
        device: invitation.deviceType,
      });
      if (invitation.deviceType === DeviceType.Camera) {
        await deviceState.openLocalCamera();
      }
      if (invitation.deviceType === DeviceType.Microphone) {
        await deviceState.openLocalMicrophone();
      }
      devicePermissionHint.value = '';
      deviceInviteHint.value = `已同意开启${getDeviceLabel(invitation.deviceType)}`;
    } else {
      await participantState.declineOpenDeviceInvitation({
        userId: invitation.senderUserId,
        device: invitation.deviceType,
      });
      deviceInviteHint.value = `已拒绝开启${getDeviceLabel(invitation.deviceType)}`;
    }
    deviceInviteVisible.value = false;
    pendingDeviceInvitation.value = null;
  } catch (error) {
    deviceInviteHint.value =
      error instanceof Error ? error.message : '处理邀请失败';
  } finally {
    deviceInviteLoading.value = false;
    deviceInviteDecision.value = '';
  }
}

async function toggleMic() {
  if (deviceAction.value || leavingConsultation.value || endingByDoctor.value) {
    return;
  }
  deviceAction.value = 'microphone';
  try {
    if (deviceState.microphoneStatus.value === 1) {
      await deviceState.closeLocalMicrophone();
    } else {
      await deviceState.openLocalMicrophone();
      devicePermissionHint.value = '';
    }
  } catch (error) {
    devicePermissionHint.value = getDeviceErrorHint('麦克风', error);
  } finally {
    deviceAction.value = '';
  }
}

async function toggleCamera() {
  if (deviceAction.value || leavingConsultation.value || endingByDoctor.value) {
    return;
  }
  deviceAction.value = 'camera';
  try {
    if (deviceState.cameraStatus.value === 1) {
      await deviceState.closeLocalCamera();
    } else {
      await deviceState.openLocalCamera();
      devicePermissionHint.value = '';
    }
  } catch (error) {
    devicePermissionHint.value = getDeviceErrorHint('摄像头', error);
  } finally {
    deviceAction.value = '';
  }
}

onMounted(async () => {
  const currentUser = getSessionUser();
  if (!currentUser || currentUser.role !== 'patient' || !appointment.value) {
    router.replace('/login');
    return;
  }
  consultationSessionStartedAt.value = Date.now();
  await ensureJoined();
  await ensureChatConversation();
  await participantState
    .getParticipantList({ cursor: '' })
    .catch(() => undefined);
  const deviceResults = await Promise.allSettled([
    deviceState.openLocalMicrophone(),
    deviceState.openLocalCamera(),
  ]);
  updateDevicePermissionHint(deviceResults);
  roomState.subscribeEvent(RoomEvent.onRoomEnded, handleRoomEnded);
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationReceived,
    onDeviceInvitationReceived
  );
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationCancelled,
    onDeviceInvitationCancelled
  );
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationTimeout,
    onDeviceInvitationTimeout
  );
  timerInterval = window.setInterval(() => {
    timer.value += 1;
  }, 1000);
});

watch(
  () => chatMessages.value.length,
  async () => {
    await nextTick();
    scrollChatToBottom();
  }
);

watch(
  () => chatPanelVisible.value,
  async visible => {
    if (visible) {
      await nextTick();
      scrollChatToBottom();
    }
  }
);

watch(
  () => transcriptionMessages.value.length,
  async length => {
    if (!length) {
      return;
    }
    if (transcriptionPanelVisible.value) {
      seenTranscriptionCount.value = length;
      await nextTick();
      scrollTranscriptionToBottom();
    }
  }
);

watch(
  () => transcriptionPanelVisible.value,
  async visible => {
    if (visible) {
      seenTranscriptionCount.value = transcriptionMessages.value.length;
      await nextTick();
      scrollTranscriptionToBottom();
    }
  }
);

onUnmounted(() => {
  roomState.unsubscribeEvent(RoomEvent.onRoomEnded, handleRoomEnded);
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationReceived,
    onDeviceInvitationReceived
  );
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationCancelled,
    onDeviceInvitationCancelled
  );
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationTimeout,
    onDeviceInvitationTimeout
  );
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  void clearConsultationSession();
});

onBeforeRouteLeave(to => {
  if (endingByDoctor.value || leavingConsultation.value || !appointment.value) {
    return true;
  }

  void leaveConsultationTo(to.fullPath);
  return false;
});
</script>

<template>
  <div
    v-if="appointment && doctor && patient"
    class="h-screen w-screen overflow-hidden bg-gradient-to-br from-[#EEF6FB] via-[#E6F5F7] to-[#EEF2FF]"
  >
    <div
      class="w-full h-full overflow-hidden bg-gradient-to-br from-[#163768] via-[#142E58] to-[#122747] relative"
    >
      <ConsultationVideoStage
        :main-member="mainVideoMember"
        :thumbnail-members="thumbnailVideoMembers"
        thumbnail-list-class="top-[86px] right-4 max-h-[calc(100%-230px)] w-32"
        thumbnail-card-class="h-36"
        @focus="focusParticipant"
      />

      <div
        class="absolute top-0 left-0 right-0 px-5 pt-4 pb-3 bg-gradient-to-b from-black/40 to-transparent z-20"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-12 h-12 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center text-white font-semibold shrink-0"
            >
              {{ doctor.userName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p
                class="text-white font-semibold text-lg leading-tight truncate"
              >
                {{ doctor.userName }}
              </p>
              <p class="text-white/75 text-xs leading-tight mt-0.5 truncate">
                {{ doctor.department }} · {{ doctor.title }}
              </p>
            </div>
          </div>

          <div
            class="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shrink-0"
          >
            <span
              class="inline-block h-2.5 w-2.5 rounded-full bg-[#00D08A] animate-pulse"
            ></span>
            <span class="text-white text-base font-mono leading-none">{{
              formattedTimer
            }}</span>
          </div>
        </div>

        <div
          class="mt-3 inline-flex items-center gap-2 bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-md"
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
          class="mt-3"
        >
          <MedicalAlert variant="warning">
            {{ devicePermissionHint }}
          </MedicalAlert>
        </div>
      </div>

      <div
        class="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 z-20"
      >
        <button
          @click="toggleMic"
          :disabled="!!deviceAction || leavingConsultation || endingByDoctor"
          :class="[
            'w-16 h-16 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
            deviceState.microphoneStatus.value === 1
              ? 'bg-[#334155]/90 hover:bg-[#475569]'
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
            :size="26"
            class="mx-auto text-white"
          />
        </button>
        <button
          @click="leaveConsultation"
          :disabled="leavingConsultation || endingByDoctor"
          class="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-[0_10px_24px_rgba(239,68,68,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LoadingSpinner
            v-if="leavingConsultation || endingByDoctor"
            class="mx-auto text-white"
          />
          <PhoneOff v-else :size="34" class="mx-auto text-white" />
        </button>
        <button
          @click="toggleCamera"
          :disabled="!!deviceAction || leavingConsultation || endingByDoctor"
          :class="[
            'w-16 h-16 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
            deviceState.cameraStatus.value === 1
              ? 'bg-[#334155]/90 hover:bg-[#475569]'
              : 'bg-red-500 hover:bg-red-600',
          ]"
        >
          <LoadingSpinner
            v-if="deviceAction === 'camera'"
            class="mx-auto text-white"
          />
          <component
            v-else
            :is="deviceState.cameraStatus.value === 1 ? Camera : CameraOff"
            :size="26"
            class="mx-auto text-white"
          />
        </button>
      </div>

      <div
        class="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-20"
      >
        <button
          @click="speakerEnabled = !speakerEnabled"
          class="px-4 py-2 rounded-full bg-[#111827]/70 text-white text-sm flex items-center gap-2"
        >
          <component :is="speakerEnabled ? Volume2 : VolumeX" :size="16" />
          扬声器
        </button>
        <button
          @click="toggleChatPanel"
          class="px-4 py-2 rounded-full bg-[#111827]/70 text-white text-sm flex items-center gap-2"
        >
          <MessageCircle :size="16" />
          消息
        </button>
      </div>

      <button
        @click="toggleTranscriptionPanel"
        class="absolute bottom-32 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#0D9488] to-[#0F766E] flex items-center justify-center shadow-2xl shadow-teal-500/30 z-20"
      >
        <FileText class="w-6 h-6 text-white" />
        <div
          v-if="transcriptionUnreadCount > 0"
          class="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full flex items-center justify-center border-2 border-black"
        >
          <span class="text-white text-[11px] leading-none font-semibold">{{
            transcriptionUnreadText
          }}</span>
        </div>
      </button>

      <div
        class="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] rounded-full bg-[#0F172A]/55 text-center py-2 px-4 text-white/85 text-xs z-20"
      >
        请根据医生指导进行描述，诊疗结束后可查看电子处方
      </div>

      <div
        v-if="transcriptionPanelVisible"
        class="absolute inset-0 bg-black/45 z-30"
        @click.self="closeTranscriptionPanel"
      >
        <div
          class="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl pb-safe max-h-[70vh] flex flex-col"
        >
          <div
            class="flex items-center justify-center py-3 border-b border-gray-100"
          >
            <div class="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100"
          >
            <div class="flex items-center gap-2">
              <FileText class="w-5 h-5 text-[#0D9488]" />
              <h3 class="font-semibold text-gray-900">实时转写</h3>
            </div>
            <button
              @click="closeTranscriptionPanel"
              class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ChevronDown class="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div
            ref="transcriptionContainerRef"
            class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
          >
            <div
              v-for="item in transcriptionMessages"
              :key="item.segmentId"
              :class="[
                'flex gap-3',
                isPatientSpeaker(item.speakerUserId) ? 'flex-row-reverse' : '',
              ]"
            >
              <div class="shrink-0">
                <div
                  :class="[
                    'w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center',
                    isPatientSpeaker(item.speakerUserId)
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-[#0D9488] to-[#0F766E]',
                  ]"
                >
                  {{
                    isPatientSpeaker(item.speakerUserId)
                      ? patient.userName.charAt(0)
                      : doctor.userName.charAt(0)
                  }}
                </div>
              </div>

              <div
                :class="[
                  'flex-1 flex flex-col',
                  isPatientSpeaker(item.speakerUserId)
                    ? 'items-end'
                    : 'items-start',
                ]"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-gray-500 font-medium">
                    {{ getTranscriptionSpeakerName(item.speakerUserId) }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ formatTranscriptionTime(item.timestamp) }}
                  </span>
                </div>
                <div
                  :class="[
                    'px-3 py-2 rounded-2xl max-w-[85%]',
                    isPatientSpeaker(item.speakerUserId)
                      ? 'bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white'
                      : 'bg-gray-100 text-gray-900',
                  ]"
                >
                  <p class="text-sm leading-relaxed">{{ item.sourceText }}</p>
                </div>
              </div>
            </div>

            <div
              v-if="transcriptionMessages.length === 0"
              class="text-center text-sm text-gray-400 py-10"
            >
              暂无转写内容，医生开启实时转写后将显示在这里
            </div>
          </div>

          <div class="px-4 py-3 bg-blue-50 border-t border-blue-100">
            <p
              class="text-xs text-blue-800 text-center flex items-center justify-center gap-1"
            >
              <Clock class="w-3 h-3" />
              AI 自动转写中，仅供参考
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="chatPanelVisible"
        class="absolute inset-0 bg-black/45 z-30"
        @click.self="chatPanelVisible = false"
      >
        <div
          class="absolute left-0 right-0 bottom-0 h-[58%] bg-white rounded-t-[28px] overflow-hidden flex flex-col"
        >
          <div
            class="h-14 px-4 border-b border-gray-100 flex items-center justify-between"
          >
            <h3 class="text-base font-semibold text-gray-900">文字聊天</h3>
            <button
              @click="chatPanelVisible = false"
              class="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
            >
              <X :size="18" />
            </button>
          </div>

          <div
            ref="chatContainerRef"
            class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
          >
            <div
              v-for="item in chatMessages"
              :key="item.ID"
              :class="[
                'flex gap-2',
                item.flow === 'out' ? 'justify-end' : 'justify-start',
              ]"
            >
              <template v-if="item.flow !== 'out'">
                <div
                  class="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-semibold flex items-center justify-center shrink-0"
                >
                  {{ doctor.userName.charAt(0) }}
                </div>
                <div class="max-w-[72%]">
                  <div
                    class="bg-gray-100 text-gray-900 rounded-2xl px-3 py-2 text-sm"
                  >
                    {{ getConsultationMessageText(item) }}
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1">
                    {{ formatMessageTime(item.time) }}
                  </p>
                </div>
              </template>
              <template v-else>
                <div class="max-w-[72%]">
                  <div
                    class="bg-[#0D9488] text-white rounded-2xl px-3 py-2 text-sm"
                  >
                    {{ getConsultationMessageText(item) }}
                  </div>
                  <p class="text-[11px] text-gray-400 mt-1 text-right">
                    {{ formatMessageTime(item.time) }}
                  </p>
                </div>
                <div
                  class="w-7 h-7 rounded-full bg-[#3B82F6] text-white text-xs font-semibold flex items-center justify-center shrink-0"
                >
                  {{ patient.userName.charAt(0) }}
                </div>
              </template>
            </div>
            <div
              v-if="chatMessages.length === 0"
              class="text-center text-sm text-gray-400 py-10"
            >
              {{
                activeConversation?.conversationID
                  ? '暂无聊天消息'
                  : '正在初始化会话...'
              }}
            </div>
          </div>

          <div class="border-t border-gray-100 p-3">
            <div class="flex items-center gap-2">
              <input
                v-model="chatInput"
                @keyup.enter="handleSendMessage"
                class="flex-1 h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0D9488]"
                placeholder="输入消息..."
              />
              <button
                @click="handleSendMessage"
                :disabled="isSendingMessage"
                class="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LoadingSpinner v-if="isSendingMessage" />
                <Send v-else :size="16" />
              </button>
            </div>
            <p class="mt-2 text-xs text-red-500 min-h-4">{{ chatError }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="deviceInviteVisible"
        class="absolute inset-0 bg-black/45 z-40 flex items-center justify-center p-6"
      >
        <div
          class="w-full max-w-[360px] rounded-3xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.25)] p-5"
        >
          <h3 class="text-[17px] font-semibold text-[#0F172A] leading-7">
            设备开启请求
          </h3>
          <p class="mt-2 text-sm text-[#475569] leading-6">
            {{ deviceInviteTitle }}
          </p>
          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              @click="handleDeviceInvitationDecision(false)"
              :disabled="deviceInviteLoading"
              class="h-10 rounded-xl border border-[#E2E8F0] text-[#475569] font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <LoadingSpinner v-if="deviceInviteDecision === 'decline'" />
              {{ deviceInviteDecision === 'decline' ? '处理中...' : '拒绝' }}
            </button>
            <button
              @click="handleDeviceInvitationDecision(true)"
              :disabled="deviceInviteLoading"
              class="h-10 rounded-xl bg-[#0D9488] text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <LoadingSpinner v-if="deviceInviteDecision === 'accept'" />
              {{ deviceInviteDecision === 'accept' ? '处理中...' : '同意' }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="deviceInviteHint"
        class="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black/55 px-4 py-2 text-white text-xs"
      >
        {{ deviceInviteHint }}
      </div>
    </div>
  </div>
</template>
