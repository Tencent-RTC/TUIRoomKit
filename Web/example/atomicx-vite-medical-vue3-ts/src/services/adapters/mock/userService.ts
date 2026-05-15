import { mockDoctorUsers, mockPatientUsers } from '@/mock/users';
import type { MedicalUser, UserService } from '@/services/adapters/types';

function findUserById(userId: string): MedicalUser | null {
  return (
    mockDoctorUsers.find(item => item.userId === userId) ||
    mockPatientUsers.find(item => item.userId === userId) ||
    null
  );
}

export const mockUserService: UserService = {
  listDoctors() {
    return mockDoctorUsers;
  },
  listPatients() {
    return mockPatientUsers;
  },
  getUserById(userId) {
    return findUserById(userId);
  },
  getDoctorById(userId) {
    return mockDoctorUsers.find(item => item.userId === userId) || null;
  },
  getPatientById(userId) {
    return mockPatientUsers.find(item => item.userId === userId) || null;
  },
};
