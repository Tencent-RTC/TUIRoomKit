import type { RoomParticipant } from 'tuikit-atomicx-vue3';

export type ConsultationRole = 'primaryDoctor' | 'consultingDoctor' | 'patient';

export interface ConsultationPermissions {
  canInviteDoctor: boolean;
  canCancelInvite: boolean;
  canKickMember: boolean;
  canManagePatientDevice: boolean;
}

export interface ConsultationVideoMember {
  userId: string;
  displayName: string;
  avatarText: string;
  role: ConsultationRole;
  roleLabel: string;
  participant: RoomParticipant;
  videoReady: boolean;
  isSelf: boolean;
}

export interface ConsultationMemberCard {
  userId: string;
  userName: string;
  isPatient: boolean;
  roleLabel: string;
  roleClass: string;
  avatarClass: string;
  cameraOn: boolean;
  microphoneOn: boolean;
  pending: boolean;
  cancelable: boolean;
}

export interface DoctorInviteListItem {
  userId: string;
  userName: string;
  department?: string;
  title?: string;
  inviteStatus: 'idle' | 'pending' | 'joined';
}

export interface ConsultationTranscriptItem {
  segmentId: string;
  speakerUserId: string;
  sourceText: string;
  timestamp: number;
}

export interface ConsultationCallEvent {
  call?: {
    roomId?: string;
    callee?: {
      userId?: string;
    };
    inviter?: {
      userId?: string;
    };
    caller?: {
      userId?: string;
    };
  };
  roomInfo?: {
    roomId?: string;
  };
  inviter?: {
    userId?: string;
  };
  senderUserId?: string;
}

export interface ConsultationParticipantEvent {
  userInfo?: {
    userId?: string;
  };
}
