import type { MedicalUser, UserService } from '@/services/adapters/types';

function buildPlaceholderUser(
  role: MedicalUser['role'],
  userId: string
): MedicalUser {
  return {
    userId,
    userName: userId,
    avatarUrl: '',
    role,
  };
}

export const integrationUserService: UserService = {
  listDoctors() {
    return [];
  },
  listPatients() {
    return [];
  },
  getUserById(userId) {
    return (
      this.getDoctorById(userId) ||
      this.getPatientById(userId) ||
      buildPlaceholderUser('doctor', userId)
    );
  },
  getDoctorById(userId) {
    return buildPlaceholderUser('doctor', userId);
  },
  getPatientById(userId) {
    return buildPlaceholderUser('patient', userId);
  },
};
