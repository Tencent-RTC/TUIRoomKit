import type { UserRole } from '@/services/adapters';

export function getDefaultRoute(role: UserRole, appointmentId?: string) {
  if (role === 'doctor') {
    return appointmentId
      ? `/doctor/consultation/${appointmentId}`
      : '/doctor/dashboard';
  }
  return appointmentId
    ? `/patient/waiting/${appointmentId}`
    : '/patient/select-doctor';
}
