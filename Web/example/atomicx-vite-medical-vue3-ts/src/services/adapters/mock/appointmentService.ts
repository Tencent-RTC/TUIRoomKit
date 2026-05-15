import { mockAppointments } from '@/mock/appointments';
import type {
  AppointmentService,
  MedicalAppointment,
} from '@/services/adapters/types';

function cloneAppointment(
  appointment: MedicalAppointment | undefined
): MedicalAppointment | null {
  return appointment ? { ...appointment } : null;
}

export const mockAppointmentService: AppointmentService = {
  getAppointmentById(appointmentId) {
    return cloneAppointment(
      mockAppointments.find(item => item.id === appointmentId)
    );
  },
  getAppointmentByRoomId(roomId) {
    return cloneAppointment(mockAppointments.find(item => item.roomId === roomId));
  },
  getAppointmentsByDoctor(doctorId) {
    return mockAppointments
      .filter(item => item.doctorId === doctorId)
      .map(item => ({ ...item }));
  },
  getAppointmentsByPatient(patientId) {
    return mockAppointments
      .filter(item => item.patientId === patientId)
      .map(item => ({ ...item }));
  },
};
