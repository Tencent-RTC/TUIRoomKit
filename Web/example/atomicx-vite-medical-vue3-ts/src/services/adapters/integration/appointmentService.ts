import type {
  AppointmentService,
  MedicalAppointment,
} from '@/services/adapters/types';
import { getRequiredLaunchContext } from '@/services/adapters/integration/launchContext';

function getLaunchAppointmentId() {
  return getRequiredLaunchContext()?.appointmentId || '';
}

function getLaunchUserContext() {
  const context = getRequiredLaunchContext();
  const role = context?.role;
  const userId = context?.userId || '';
  const doctorId =
    context?.doctorId ||
    (role === 'doctor' ? userId : '') ||
    'doctor_placeholder';
  const patientId =
    context?.patientId ||
    (role === 'patient' ? userId : '') ||
    'patient_placeholder';

  return { doctorId, patientId };
}

function buildIntegrationAppointment(
  appointmentId: string
): MedicalAppointment {
  // Customer integration should replace this mapper with data returned by
  // its appointment API, preserving the MedicalAppointment view model shape.
  const now = Math.floor(Date.now() / 1000);
  const { doctorId, patientId } = getLaunchUserContext();
  return {
    id: appointmentId,
    roomId: `room-${appointmentId}`,
    doctorId,
    patientId,
    scheduleStartTime: now,
    scheduleEndTime: now + 30 * 60,
    chiefComplaint: '示例主诉，请替换为客户预约系统返回的诊前信息',
    allergyHistory: '请替换为客户业务数据',
    medicalHistory: '请替换为客户业务数据',
    patientAge: 0,
    patientGender: '未知',
    patientPhone: '',
  };
}

export const integrationAppointmentService: AppointmentService = {
  getAppointmentById(appointmentId) {
    return buildIntegrationAppointment(appointmentId);
  },
  getAppointmentByRoomId(roomId) {
    const appointmentId = roomId.startsWith('room-')
      ? roomId.slice('room-'.length)
      : getLaunchAppointmentId();
    return appointmentId ? buildIntegrationAppointment(appointmentId) : null;
  },
  getAppointmentsByDoctor(doctorId) {
    const appointmentId = getLaunchAppointmentId();
    if (!appointmentId) {
      return [];
    }
    const appointment = buildIntegrationAppointment(appointmentId);
    return appointment.doctorId === doctorId ? [appointment] : [];
  },
  getAppointmentsByPatient(patientId) {
    const appointmentId = getLaunchAppointmentId();
    if (!appointmentId) {
      return [];
    }
    const appointment = buildIntegrationAppointment(appointmentId);
    return appointment.patientId === patientId ? [appointment] : [];
  },
};
