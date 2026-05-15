<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { MessageSquare, PenLine, Users } from '@/shared/icons';
import {
  DeviceStatus,
  DeviceType,
  RoomParticipantEvent,
  useAITranscriberState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3';
import type {
  ConsultationMemberCard,
  ConsultationPermissions,
  ConsultationTranscriptItem,
  DoctorInviteListItem,
} from '@/features/consultation/types';
import { services, type MedicalUser } from '@/services/adapters';
import ConsultationChatPanel from '@/features/consultation/components/ConsultationChatPanel.vue';
import ConsultationMembersPanel from '@/features/consultation/components/ConsultationMembersPanel.vue';
import ConsultationTranscriptionPanel from '@/features/consultation/components/ConsultationTranscriptionPanel.vue';
import InviteDoctorDialog from '@/features/consultation/components/InviteDoctorDialog.vue';
import KickMemberConfirmDialog from '@/features/consultation/components/KickMemberConfirmDialog.vue';
import { useConsultationChat } from '@/features/consultation/useConsultationChat';
import {
  formatConsultationClock,
  normalizeConsultationTimestamp,
} from '@/features/consultation/utils';

const props = defineProps<{
  doctor: MedicalUser;
  patient: MedicalUser;
  permissions?: ConsultationPermissions;
}>();

type PanelTab = 'chat' | 'transcribe' | 'members';
type DeviceInviteKey = 'camera' | 'microphone';
type DeviceInviteStatus =
  | 'idle'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'timeout'
  | 'cancelled';

const activeTab = ref<PanelTab>('chat');
const permissions = computed<ConsultationPermissions>(() => ({
  canInviteDoctor: props.permissions?.canInviteDoctor ?? true,
  canCancelInvite: props.permissions?.canCancelInvite ?? true,
  canKickMember: props.permissions?.canKickMember ?? true,
  canManagePatientDevice: props.permissions?.canManagePatientDevice ?? true,
}));

const roomState = useRoomState();
const participantState = useRoomParticipantState();
const {
  realtimeMessageList,
  startRealtimeTranscriber,
  stopRealtimeTranscriber,
} = useAITranscriberState();

const consultationSessionStartedAt = ref(Date.now());
const patientUserId = computed(() => props.patient.userId);
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
  peerUserId: patientUserId,
  sessionStartedAt: consultationSessionStartedAt,
});

const transcriberRunning = ref(false);
const transcriberBusy = ref(false);
const transcriberHint = ref('');
const isCopyingDraft = ref(false);
const isExportingDraft = ref(false);
let clearingSession = false;

const inviteDialogVisible = ref(false);
const inviteKeyword = ref('');
const inviteFeedback = ref('');
const invitingDoctorId = ref<string | null>(null);
const cancellingDoctorId = ref<string | null>(null);
const kickingUserId = ref<string | null>(null);
const kickConfirmTarget = ref<{ userId: string; userName: string } | null>(
  null
);
const patientDeviceInvitePending = ref<Record<DeviceInviteKey, boolean>>({
  camera: false,
  microphone: false,
});
const patientDeviceInviteLoading = ref<Record<DeviceInviteKey, boolean>>({
  camera: false,
  microphone: false,
});
const patientDeviceInviteResult = ref<Record<DeviceInviteKey, DeviceInviteStatus>>({
  camera: 'idle',
  microphone: 'idle',
});

const participantUserIdSet = computed(
  () => new Set(participantState.participantList.value.map(item => item.userId))
);
const pendingUserIdSet = computed(
  () =>
    new Set(
      participantState.pendingParticipantList.value.map(item => item.userId)
    )
);

const transcriptList = computed<ConsultationTranscriptItem[]>(() =>
  [...realtimeMessageList.value]
    .filter(item => item.sourceText?.trim())
    .filter(
      item =>
        normalizeConsultationTimestamp(item.timestamp) >=
        consultationSessionStartedAt.value
    )
    .sort(
      (a, b) =>
        normalizeConsultationTimestamp(a.timestamp) -
        normalizeConsultationTimestamp(b.timestamp)
    )
);

const transcriptText = computed(() =>
  transcriptList.value
    .map(
      item =>
        `[${formatConsultationClock(item.timestamp)}] ${getSpeakerName(item.speakerUserId)}：${item.sourceText}`
    )
    .join('\n')
);

const doctorInviteList = computed<DoctorInviteListItem[]>(() => {
  const keyword = inviteKeyword.value.trim().toLowerCase();
  return services.user
    .listDoctors()
    .filter(item => item.userId !== props.doctor.userId)
    .map(item => {
      let inviteStatus: 'idle' | 'pending' | 'joined' = 'idle';
      if (participantUserIdSet.value.has(item.userId)) {
        inviteStatus = 'joined';
      } else if (pendingUserIdSet.value.has(item.userId)) {
        inviteStatus = 'pending';
      }
      return { ...item, inviteStatus };
    })
    .filter(item => item.inviteStatus !== 'joined')
    .filter(item => {
      if (!keyword) {
        return true;
      }
      return [item.userName, item.department, item.title]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(keyword));
    });
});

const memberCards = computed<ConsultationMemberCard[]>(() => [
  ...participantState.participantList.value.map(item => {
    const doctorInfo = services.user.getDoctorById(item.userId);
    const patientInfo = services.user.getPatientById(item.userId);
    const displayName =
      item.nameCard ||
      doctorInfo?.userName ||
      patientInfo?.userName ||
      item.userName ||
      item.userId;
    const isPatient = item.userId === props.patient.userId;
    const isPrimaryDoctor = item.userId === props.doctor.userId;
    return {
      userId: item.userId,
      userName: displayName,
      isPatient,
      roleLabel: getMemberRoleLabel(isPatient, isPrimaryDoctor),
      roleClass: getMemberRoleClass(isPatient, isPrimaryDoctor),
      avatarClass: getMemberAvatarClass(isPatient, isPrimaryDoctor),
      cameraOn: item.cameraStatus === DeviceStatus.On,
      microphoneOn: item.microphoneStatus === DeviceStatus.On,
      pending: false,
      cancelable: false,
    };
  }),
  ...participantState.pendingParticipantList.value
    .filter(item => !participantUserIdSet.value.has(item.userId))
    .map(item => {
      const doctorInfo = services.user.getDoctorById(item.userId);
      return {
        userId: item.userId,
        userName: doctorInfo?.userName || item.userName || item.userId,
        isPatient: false,
        roleLabel: '待加入',
        roleClass: 'bg-[#F3F4F6] text-[#4B5563]',
        avatarClass: 'from-[#CBD5E1] to-[#94A3B8]',
        cameraOn: false,
        microphoneOn: false,
        pending: true,
        cancelable: !!doctorInfo && item.userId !== props.doctor.userId,
      };
    }),
]);

const patientCameraOn = computed(() =>
  participantState.participantList.value.some(
    item =>
      item.userId === props.patient.userId &&
      item.cameraStatus === DeviceStatus.On
  )
);
const patientMicrophoneOn = computed(() =>
  participantState.participantList.value.some(
    item =>
      item.userId === props.patient.userId &&
      item.microphoneStatus === DeviceStatus.On
  )
);

watch(
  () => props.patient.userId,
  async () => {
    consultationSessionStartedAt.value = Date.now();
    resetPatientDeviceInvite();
    await ensureChatConversation();
  },
  { immediate: true }
);

watch(
  () => inviteDialogVisible.value,
  visible => {
    if (!visible) {
      inviteKeyword.value = '';
      inviteFeedback.value = '';
      invitingDoctorId.value = null;
      cancellingDoctorId.value = null;
    }
  }
);

watch(patientCameraOn, cameraOn => {
  if (cameraOn && patientDeviceInvitePending.value.camera) {
    setDeviceInviteState('camera', false, 'accepted');
  }
});

watch(patientMicrophoneOn, microphoneOn => {
  if (microphoneOn && patientDeviceInvitePending.value.microphone) {
    setDeviceInviteState('microphone', false, 'accepted');
  }
});

function getMemberRoleLabel(isPatient: boolean, isPrimaryDoctor: boolean) {
  if (isPatient) {
    return '患者';
  }
  return isPrimaryDoctor ? '主诊医生' : '会诊医生';
}

function getMemberRoleClass(isPatient: boolean, isPrimaryDoctor: boolean) {
  if (isPatient) {
    return 'bg-[#E0ECFF] text-[#1D4ED8]';
  }
  return isPrimaryDoctor
    ? 'bg-[#FEF3C7] text-[#92400E]'
    : 'bg-[#DCFCE7] text-[#166534]';
}

function getMemberAvatarClass(isPatient: boolean, isPrimaryDoctor: boolean) {
  if (isPatient) {
    return 'from-[#3B82F6] to-[#2563EB]';
  }
  return isPrimaryDoctor
    ? 'from-[#0D9488] to-[#0F766E]'
    : 'from-[#14B8A6] to-[#0F766E]';
}

async function clearConsultationSessionData() {
  if (clearingSession) {
    return;
  }
  clearingSession = true;
  try {
    inviteFeedback.value = '';
    await clearChatConversation();
    if (transcriberRunning.value) {
      await stopRealtimeTranscriber().catch(() => undefined);
      transcriberRunning.value = false;
    }
  } finally {
    clearingSession = false;
  }
}

function getSpeakerName(userId: string) {
  if (!userId) {
    return '未知成员';
  }
  const participant = participantState.participantList.value.find(
    item => item.userId === userId
  );
  if (participant) {
    return participant.nameCard || participant.userName || participant.userId;
  }
  if (userId === props.doctor.userId) {
    return props.doctor.userName;
  }
  if (userId === props.patient.userId) {
    return props.patient.userName;
  }
  return (
    services.user.getDoctorById(userId)?.userName ||
    services.user.getPatientById(userId)?.userName ||
    userId
  );
}

async function toggleRealtimeTranscriber() {
  if (transcriberBusy.value) {
    return;
  }
  transcriberBusy.value = true;
  transcriberHint.value = '';
  try {
    if (transcriberRunning.value) {
      await stopRealtimeTranscriber();
      transcriberRunning.value = false;
      transcriberHint.value = '实时转写已关闭';
      return;
    }
    await startRealtimeTranscriber({
      sourceLanguage: 'zh',
      translationLanguages: ['en'],
    });
    transcriberRunning.value = true;
    transcriberHint.value = '实时转写已开启';
  } catch (error) {
    transcriberHint.value =
      error instanceof Error ? error.message : '转写操作失败';
  } finally {
    transcriberBusy.value = false;
  }
}

async function copyDraft() {
  if (isCopyingDraft.value) {
    return;
  }
  if (!transcriptText.value) {
    transcriberHint.value = '暂无可复制内容';
    return;
  }
  isCopyingDraft.value = true;
  try {
    await navigator.clipboard.writeText(transcriptText.value);
    transcriberHint.value = '内容已复制到剪贴板';
  } catch {
    transcriberHint.value = '复制失败，请检查浏览器权限';
  } finally {
    isCopyingDraft.value = false;
  }
}

function exportDraft() {
  if (isExportingDraft.value) {
    return;
  }
  if (!transcriptText.value) {
    transcriberHint.value = '暂无可导出内容';
    return;
  }
  isExportingDraft.value = true;
  try {
    const blob = new Blob([transcriptText.value], {
      type: 'text/plain;charset=utf-8',
    });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `consultation-draft-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(fileUrl);
    transcriberHint.value = '内容已导出';
  } finally {
    isExportingDraft.value = false;
  }
}

async function inviteDoctor(userId: string) {
  if (!permissions.value.canInviteDoctor) {
    inviteFeedback.value = '当前角色无权邀请会诊医生';
    return;
  }
  const roomId = roomState.currentRoom.value?.roomId;
  if (!roomId) {
    inviteFeedback.value = '当前不在房间中，暂时无法邀请会诊医生';
    return;
  }
  invitingDoctorId.value = userId;
  inviteFeedback.value = '';
  try {
    await roomState.callUserToRoom({
      roomId: String(roomId),
      userIdList: [userId],
      timeout: 45,
      extensionInfo: `${props.doctor.userName}邀请您加入会诊`,
    });
    inviteFeedback.value = '邀请已发送，等待对方接听';
    await participantState.getParticipantList({ cursor: '' });
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error ? error.message : '邀请失败，请稍后重试';
  } finally {
    invitingDoctorId.value = null;
  }
}

async function cancelInvite(userId: string) {
  if (!permissions.value.canCancelInvite) {
    inviteFeedback.value = '当前角色无权取消会诊邀请';
    return;
  }
  const roomId = roomState.currentRoom.value?.roomId;
  if (!roomId) {
    inviteFeedback.value = '当前不在房间中，暂时无法取消邀请';
    return;
  }
  cancellingDoctorId.value = userId;
  inviteFeedback.value = '';
  try {
    await roomState.cancelCall({
      roomId: String(roomId),
      userIdList: [userId],
    });
    inviteFeedback.value = '已取消邀请';
    await participantState.getParticipantList({ cursor: '' });
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error ? error.message : '取消邀请失败，请稍后重试';
  } finally {
    cancellingDoctorId.value = null;
  }
}

function getDeviceKey(deviceType: DeviceType): DeviceInviteKey | null {
  if (deviceType === DeviceType.Camera) {
    return 'camera';
  }
  if (deviceType === DeviceType.Microphone) {
    return 'microphone';
  }
  return null;
}

function getDeviceLabel(deviceType: DeviceType) {
  return deviceType === DeviceType.Camera ? '摄像头' : '麦克风';
}

function setDeviceInviteLoading(key: DeviceInviteKey, loading: boolean) {
  patientDeviceInviteLoading.value = {
    ...patientDeviceInviteLoading.value,
    [key]: loading,
  };
}

function setDeviceInviteState(
  key: DeviceInviteKey,
  pending: boolean,
  status: DeviceInviteStatus
) {
  patientDeviceInvitePending.value = {
    ...patientDeviceInvitePending.value,
    [key]: pending,
  };
  patientDeviceInviteResult.value = {
    ...patientDeviceInviteResult.value,
    [key]: status,
  };
}

function resetPatientDeviceInvite() {
  patientDeviceInvitePending.value = { camera: false, microphone: false };
  patientDeviceInviteLoading.value = { camera: false, microphone: false };
  patientDeviceInviteResult.value = { camera: 'idle', microphone: 'idle' };
}

async function invitePatientOpenDevice(deviceType: DeviceType) {
  if (!permissions.value.canManagePatientDevice || !props.patient?.userId) {
    return;
  }
  const key = getDeviceKey(deviceType);
  if (!key) {
    return;
  }
  setDeviceInviteLoading(key, true);
  inviteFeedback.value = '';
  try {
    await participantState.inviteToOpenDevice({
      userId: props.patient.userId,
      device: deviceType,
      timeout: 30,
    });
    setDeviceInviteState(key, true, 'pending');
    inviteFeedback.value = `已邀请患者开启${getDeviceLabel(deviceType)}`;
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error
        ? error.message
        : `邀请开启${getDeviceLabel(deviceType)}失败`;
  } finally {
    setDeviceInviteLoading(key, false);
  }
}

async function cancelPatientOpenDeviceInvitation(deviceType: DeviceType) {
  if (!permissions.value.canManagePatientDevice || !props.patient?.userId) {
    return;
  }
  const key = getDeviceKey(deviceType);
  if (!key) {
    return;
  }
  setDeviceInviteLoading(key, true);
  inviteFeedback.value = '';
  try {
    await participantState.cancelOpenDeviceInvitation({
      userId: props.patient.userId,
      device: deviceType,
    });
    setDeviceInviteState(key, false, 'cancelled');
    inviteFeedback.value = `已取消患者${getDeviceLabel(deviceType)}邀请`;
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error
        ? error.message
        : `取消${getDeviceLabel(deviceType)}邀请失败`;
  } finally {
    setDeviceInviteLoading(key, false);
  }
}

async function closePatientDevice(deviceType: DeviceType) {
  if (!permissions.value.canManagePatientDevice || !props.patient?.userId) {
    return;
  }
  const key = getDeviceKey(deviceType);
  if (!key) {
    return;
  }
  setDeviceInviteLoading(key, true);
  inviteFeedback.value = '';
  try {
    await participantState.closeParticipantDevice({
      userId: props.patient.userId,
      deviceType,
    });
    setDeviceInviteState(key, false, 'idle');
    inviteFeedback.value = `已关闭患者${getDeviceLabel(deviceType)}`;
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error
        ? error.message
        : `关闭${getDeviceLabel(deviceType)}失败`;
  } finally {
    setDeviceInviteLoading(key, false);
  }
}

function requestKickMember(member: { userId: string; userName: string }) {
  if (!permissions.value.canKickMember) {
    inviteFeedback.value = '当前角色无权移出成员';
    return;
  }
  kickConfirmTarget.value = member;
}

function cancelKickConfirm() {
  if (!kickingUserId.value) {
    kickConfirmTarget.value = null;
  }
}

async function confirmKickMember() {
  if (!permissions.value.canKickMember) {
    inviteFeedback.value = '当前角色无权移出成员';
    kickConfirmTarget.value = null;
    return;
  }
  if (!kickConfirmTarget.value) {
    return;
  }
  const { userId } = kickConfirmTarget.value;
  kickingUserId.value = userId;
  inviteFeedback.value = '';
  try {
    await participantState.kickUser({ userId });
    inviteFeedback.value = '成员已移出房间';
    kickConfirmTarget.value = null;
  } catch (error) {
    inviteFeedback.value =
      error instanceof Error ? error.message : '移出成员失败，请稍后重试';
  } finally {
    kickingUserId.value = null;
  }
}

const onPatientDeviceInvitationAccepted = (options: {
  invitation: { deviceType: DeviceType };
  operator: { userId: string };
}) => {
  if (options.operator.userId !== props.patient.userId) {
    return;
  }
  const key = getDeviceKey(options.invitation.deviceType);
  if (!key) {
    return;
  }
  setDeviceInviteState(key, false, 'accepted');
  inviteFeedback.value = `患者已接受${getDeviceLabel(options.invitation.deviceType)}邀请`;
};

const onPatientDeviceInvitationDeclined = (options: {
  invitation: { deviceType: DeviceType };
  operator: { userId: string };
}) => {
  if (options.operator.userId !== props.patient.userId) {
    return;
  }
  const key = getDeviceKey(options.invitation.deviceType);
  if (!key) {
    return;
  }
  setDeviceInviteState(key, false, 'declined');
  inviteFeedback.value = `患者已拒绝${getDeviceLabel(options.invitation.deviceType)}邀请`;
};

const onPatientDeviceInvitationTimeout = (options: {
  invitation: { deviceType: DeviceType };
}) => {
  const key = getDeviceKey(options.invitation.deviceType);
  if (!key || !patientDeviceInvitePending.value[key]) {
    return;
  }
  setDeviceInviteState(key, false, 'timeout');
  inviteFeedback.value = `${getDeviceLabel(options.invitation.deviceType)}邀请已超时`;
};

const onPatientDeviceInvitationCancelled = (options: {
  invitation: { deviceType: DeviceType };
}) => {
  const key = getDeviceKey(options.invitation.deviceType);
  if (!key || !patientDeviceInvitePending.value[key]) {
    return;
  }
  setDeviceInviteState(key, false, 'cancelled');
  inviteFeedback.value = `${getDeviceLabel(options.invitation.deviceType)}邀请已取消`;
};

onMounted(() => {
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationAccepted,
    onPatientDeviceInvitationAccepted
  );
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationDeclined,
    onPatientDeviceInvitationDeclined
  );
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationTimeout,
    onPatientDeviceInvitationTimeout
  );
  participantState.subscribeEvent(
    RoomParticipantEvent.onDeviceInvitationCancelled,
    onPatientDeviceInvitationCancelled
  );
});

onBeforeUnmount(() => {
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationAccepted,
    onPatientDeviceInvitationAccepted
  );
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationDeclined,
    onPatientDeviceInvitationDeclined
  );
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationTimeout,
    onPatientDeviceInvitationTimeout
  );
  participantState.unsubscribeEvent(
    RoomParticipantEvent.onDeviceInvitationCancelled,
    onPatientDeviceInvitationCancelled
  );
  void clearConsultationSessionData();
});
</script>

<template>
  <div
    class="h-full min-h-0 bg-white border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden flex flex-col"
  >
    <div class="w-full grid grid-cols-3 p-2 bg-gray-50 border-b border-gray-100">
      <button
        @click="activeTab = 'chat'"
        :class="[
          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
          activeTab === 'chat'
            ? 'bg-white text-[#0D9488] shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <MessageSquare :size="16" />
        聊天
      </button>
      <button
        @click="activeTab = 'transcribe'"
        :class="[
          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
          activeTab === 'transcribe'
            ? 'bg-white text-[#0D9488] shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <PenLine :size="16" />
        转写
      </button>
      <button
        @click="activeTab = 'members'"
        :class="[
          'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all',
          activeTab === 'members'
            ? 'bg-white text-[#0D9488] shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <Users :size="16" />
        成员
      </button>
    </div>

    <div class="flex-1 min-h-0 bg-white">
      <ConsultationChatPanel
        v-if="activeTab === 'chat'"
        v-model:chat-input="chatInput"
        :doctor="doctor"
        :patient="patient"
        :messages="chatMessages"
        :active-conversation-id="activeConversation?.conversationID"
        :chat-error="chatError"
        :is-sending-message="isSendingMessage"
        @send="handleSendMessage"
      />
      <ConsultationTranscriptionPanel
        v-else-if="activeTab === 'transcribe'"
        :transcript-list="transcriptList"
        :transcript-text="transcriptText"
        :transcriber-running="transcriberRunning"
        :transcriber-busy="transcriberBusy"
        :transcriber-hint="transcriberHint"
        :is-copying-draft="isCopyingDraft"
        :is-exporting-draft="isExportingDraft"
        :get-speaker-name="getSpeakerName"
        @toggle="toggleRealtimeTranscriber"
        @copy="copyDraft"
        @export="exportDraft"
      />
      <ConsultationMembersPanel
        v-else
        :member-cards="memberCards"
        :permissions="permissions"
        :invite-feedback="inviteFeedback"
        :kicking-user-id="kickingUserId"
        :cancelling-doctor-id="cancellingDoctorId"
        :patient-device-invite-pending="patientDeviceInvitePending"
        :patient-device-invite-loading="patientDeviceInviteLoading"
        @open-invite="inviteDialogVisible = true"
        @request-kick="requestKickMember"
        @cancel-invite="cancelInvite"
        @invite-patient-open-device="invitePatientOpenDevice"
        @cancel-patient-open-device-invitation="
          cancelPatientOpenDeviceInvitation
        "
        @close-patient-device="closePatientDevice"
      />
    </div>
  </div>

  <KickMemberConfirmDialog
    :target="kickConfirmTarget"
    :kicking-user-id="kickingUserId"
    @cancel="cancelKickConfirm"
    @confirm="confirmKickMember"
  />

  <InviteDoctorDialog
    v-if="permissions.canInviteDoctor"
    v-model:invite-keyword="inviteKeyword"
    :visible="inviteDialogVisible"
    :doctor-invite-list="doctorInviteList"
    :invite-feedback="inviteFeedback"
    :inviting-doctor-id="invitingDoctorId"
    :cancelling-doctor-id="cancellingDoctorId"
    @close="inviteDialogVisible = false"
    @invite="inviteDoctor"
    @cancel-invite="cancelInvite"
  />
</template>
