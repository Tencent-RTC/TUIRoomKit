import { computed, type Ref } from 'vue';
import type { ConsultationPermissions } from '@/features/consultation/types';

export function useConsultationPermissions(options: {
  currentUserId: Ref<string | undefined>;
  primaryDoctorId: Ref<string | undefined>;
}) {
  const isPrimaryDoctor = computed(
    () =>
      !!options.currentUserId.value &&
      options.currentUserId.value === options.primaryDoctorId.value
  );

  const permissions = computed<ConsultationPermissions>(() => ({
    canInviteDoctor: isPrimaryDoctor.value,
    canCancelInvite: isPrimaryDoctor.value,
    canKickMember: isPrimaryDoctor.value,
    canManagePatientDevice: isPrimaryDoctor.value,
  }));

  return {
    isPrimaryDoctor,
    permissions,
  };
}
