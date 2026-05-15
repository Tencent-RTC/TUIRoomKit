<script setup lang="ts">
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  UserPlus,
  UserX,
  Video,
} from '@/shared/icons';
import { DeviceType } from 'tuikit-atomicx-vue3';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import type {
  ConsultationMemberCard,
  ConsultationPermissions,
} from '@/features/consultation/types';

defineProps<{
  memberCards: ConsultationMemberCard[];
  permissions: ConsultationPermissions;
  inviteFeedback?: string;
  kickingUserId?: string | null;
  cancellingDoctorId?: string | null;
  patientDeviceInvitePending: { camera: boolean; microphone: boolean };
  patientDeviceInviteLoading: { camera: boolean; microphone: boolean };
}>();

const emit = defineEmits<{
  openInvite: [];
  requestKick: [member: { userId: string; userName: string }];
  cancelInvite: [userId: string];
  invitePatientOpenDevice: [deviceType: DeviceType];
  cancelPatientOpenDeviceInvitation: [deviceType: DeviceType];
  closePatientDevice: [deviceType: DeviceType];
}>();
</script>

<template>
  <div class="h-full min-h-0 flex flex-col">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h3 class="font-semibold text-gray-900">成员管理</h3>
      <span class="px-3 py-1 rounded-full border border-gray-200 text-sm font-medium">
        {{ memberCards.length }} 人
      </span>
    </div>

    <div class="p-4 space-y-3 min-h-0 overflow-y-auto">
      <button
        v-if="permissions.canInviteDoctor"
        @click="emit('openInvite')"
        class="w-full h-11 rounded-xl border border-dashed border-[#0D9488] text-[#0D9488] font-semibold hover:bg-[#F0FDFA] transition-colors inline-flex items-center justify-center gap-2"
      >
        <UserPlus :size="18" />
        邀请会诊医生
      </button>

      <div class="space-y-3">
        <div
          v-for="member in memberCards"
          :key="member.userId"
          class="rounded-[28px] border border-[#E9EEF5] bg-white px-4 py-4 flex items-center gap-3"
        >
          <div class="relative shrink-0">
            <div
              :class="[
                'w-16 h-16 rounded-full bg-gradient-to-br text-white text-[30px] flex items-center justify-center font-semibold',
                member.avatarClass,
              ]"
            >
              {{ member.userName.charAt(0) }}
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <p class="font-semibold text-[16px] text-[#0F172A] truncate">
                  {{ member.userName }}
                </p>
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-[12px] leading-none border',
                    member.roleClass,
                    member.isPatient ? 'border-[#BFDBFE]' : 'border-transparent',
                  ]"
                >
                  {{ member.roleLabel }}
                </span>
              </div>

              <button
                v-if="member.isPatient && permissions.canKickMember"
                @click="
                  emit('requestKick', {
                    userId: member.userId,
                    userName: member.userName,
                  })
                "
                :disabled="kickingUserId === member.userId"
                class="w-8 h-8 rounded-full text-[#94A3B8] hover:bg-red-50 hover:text-red-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                title="踢出成员"
              >
                <LoadingSpinner v-if="kickingUserId === member.userId" />
                <UserX v-else :size="18" />
              </button>
            </div>

            <div class="mt-2 flex items-center gap-2">
              <button
                v-if="member.isPatient && permissions.canManagePatientDevice"
                @click="
                  member.cameraOn
                    ? emit('closePatientDevice', DeviceType.Camera)
                    : patientDeviceInvitePending.camera
                      ? emit('cancelPatientOpenDeviceInvitation', DeviceType.Camera)
                      : emit('invitePatientOpenDevice', DeviceType.Camera)
                "
                :disabled="member.pending || patientDeviceInviteLoading.camera"
                :class="[
                  'w-11 h-11 rounded-full border flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  member.cameraOn
                    ? 'bg-white border-[#CBD5E1] text-[#64748B]'
                    : patientDeviceInvitePending.camera
                      ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#EA580C]'
                      : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#EF4444]',
                ]"
                :title="
                  member.cameraOn ? '关闭患者摄像头' : '邀请患者打开摄像头'
                "
              >
                <LoadingSpinner v-if="patientDeviceInviteLoading.camera" />
                <component
                  v-else
                  :is="member.cameraOn ? Camera : CameraOff"
                  :size="18"
                />
              </button>
              <Video
                v-else
                :size="20"
                :class="member.cameraOn ? 'text-[#475569]' : 'text-[#CBD5E1]'"
              />

              <button
                v-if="member.isPatient && permissions.canManagePatientDevice"
                @click="
                  member.microphoneOn
                    ? emit('closePatientDevice', DeviceType.Microphone)
                    : patientDeviceInvitePending.microphone
                      ? emit(
                          'cancelPatientOpenDeviceInvitation',
                          DeviceType.Microphone
                        )
                      : emit('invitePatientOpenDevice', DeviceType.Microphone)
                "
                :disabled="
                  member.pending || patientDeviceInviteLoading.microphone
                "
                :class="[
                  'w-11 h-11 rounded-full border flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  member.microphoneOn
                    ? 'bg-white border-[#CBD5E1] text-[#334155]'
                    : patientDeviceInvitePending.microphone
                      ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#EA580C]'
                      : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#EF4444]',
                ]"
                :title="
                  member.microphoneOn ? '关闭患者麦克风' : '邀请患者打开麦克风'
                "
              >
                <LoadingSpinner v-if="patientDeviceInviteLoading.microphone" />
                <component
                  v-else
                  :is="member.microphoneOn ? Mic : MicOff"
                  :size="18"
                />
              </button>
              <Mic
                v-else
                :size="20"
                :class="
                  member.microphoneOn ? 'text-[#475569]' : 'text-[#CBD5E1]'
                "
              />
            </div>
          </div>

          <button
            v-if="
              member.pending &&
              member.cancelable &&
              permissions.canCancelInvite
            "
            @click="emit('cancelInvite', member.userId)"
            :disabled="cancellingDoctorId === member.userId"
            class="h-8 px-3 rounded-full border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LoadingSpinner
              v-if="cancellingDoctorId === member.userId"
              class="mr-1"
            />
            {{ cancellingDoctorId === member.userId ? '取消中' : '取消邀请' }}
          </button>
        </div>
      </div>

      <p v-if="inviteFeedback" class="text-xs text-[#64748B] px-1">
        {{ inviteFeedback }}
      </p>

      <div class="pt-2 text-xs text-gray-500 leading-6">
        <p>• 主治医生拥有邀请、移出和患者设备管理权限</p>
        <p>• 会诊医生可发言、聊天和查看转写</p>
        <p>• 患者仅可参与视频通话</p>
      </div>
    </div>
  </div>
</template>
