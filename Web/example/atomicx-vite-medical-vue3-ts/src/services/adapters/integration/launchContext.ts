import type { LaunchContext, UserRole } from '@/services/adapters/types';

function getRole(value: string | null): UserRole | null {
  if (value === 'doctor' || value === 'patient') {
    return value;
  }
  return null;
}

export function parseLaunchContextFromUrl(): LaunchContext | null {
  const params = new URLSearchParams(window.location.search);
  const role = getRole(params.get('role'));
  const userId = params.get('userId')?.trim() || '';
  if (!role || !userId) {
    return null;
  }
  return {
    role,
    userId,
    appointmentId: params.get('appointmentId')?.trim() || undefined,
    token: params.get('token')?.trim() || undefined,
    doctorId: params.get('doctorId')?.trim() || undefined,
    patientId: params.get('patientId')?.trim() || undefined,
    userName: params.get('userName')?.trim() || undefined,
    avatarUrl: params.get('avatarUrl')?.trim() || undefined,
  };
}

export function getRequiredLaunchContext(): LaunchContext | null {
  return parseLaunchContextFromUrl();
}
