export type UserRole = 'doctor' | 'patient';
export type DoctorStatus = 'online' | 'busy';
export type LaunchMode = 'mock' | 'integration';
export type BusinessPanelMode = 'demo' | 'slot';

export interface MedicalUser {
  userId: string;
  userName: string;
  avatarUrl: string;
  role: UserRole;
  title?: string;
  department?: string;
  hospital?: string;
  experience?: string;
  rating?: string;
  consultations?: string;
  price?: string;
  tags?: string[];
  specialty?: string;
  status?: DoctorStatus;
}

export interface MedicalAppointment {
  id: string;
  roomId: string;
  doctorId: string;
  patientId: string;
  scheduleStartTime: number;
  scheduleEndTime: number;
  chiefComplaint: string;
  allergyHistory: string;
  medicalHistory: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
}

export interface BackendMedicalUserDTO {
  userId: string;
  userName: string;
  avatarUrl?: string;
  role: UserRole;
  title?: string;
  department?: string;
  hospital?: string;
}

export interface BackendMedicalAppointmentDTO {
  appointmentId: string;
  roomId?: string;
  doctorId: string;
  patientId: string;
  scheduleStartTime: number;
  scheduleEndTime: number;
  chiefComplaint?: string;
  allergyHistory?: string;
  medicalHistory?: string;
  patientAge?: number;
  patientGender?: string;
  patientPhone?: string;
}

export interface BackendLaunchContextDTO {
  role: UserRole;
  userId: string;
  appointmentId?: string;
  token?: string;
  doctorId?: string;
  patientId?: string;
  userName?: string;
  avatarUrl?: string;
}

export interface MedicalBackendAdapter {
  getLaunchContext(): Promise<BackendLaunchContextDTO | null>;
  getCurrentUser(context: BackendLaunchContextDTO): Promise<BackendMedicalUserDTO>;
  getAppointment(
    context: BackendLaunchContextDTO
  ): Promise<BackendMedicalAppointmentDTO | null>;
  listDoctors(context: BackendLaunchContextDTO): Promise<BackendMedicalUserDTO[]>;
}

export interface SessionData {
  role: UserRole;
  userId: string;
  appointmentId?: string;
  token?: string;
  launchMode?: LaunchMode;
  user?: MedicalUser;
}

export interface LaunchContext {
  role: UserRole;
  userId: string;
  appointmentId?: string;
  token?: string;
  doctorId?: string;
  patientId?: string;
  userName?: string;
  avatarUrl?: string;
}

/**
 * View-facing service contract used by the demo pages.
 *
 * Customer integration should map backend DTOs into these view models inside
 * `services/adapters/integration/*`, keeping API/auth/field differences away
 * from Vue pages.
 */
export interface AuthService {
  getLaunchContext(): LaunchContext | null;
  login(context: LaunchContext): Promise<SessionData>;
  logout(): Promise<void>;
}

export interface UserService {
  listDoctors(): MedicalUser[];
  listPatients(): MedicalUser[];
  getUserById(userId: string): MedicalUser | null;
  getDoctorById(userId: string): MedicalUser | null;
  getPatientById(userId: string): MedicalUser | null;
}

export interface AppointmentService {
  getAppointmentById(appointmentId: string): MedicalAppointment | null;
  getAppointmentByRoomId(roomId: string): MedicalAppointment | null;
  getAppointmentsByDoctor(doctorId: string): MedicalAppointment[];
  getAppointmentsByPatient(patientId: string): MedicalAppointment[];
}

export interface MedicalServiceAdapter {
  auth: AuthService;
  user: UserService;
  appointment: AppointmentService;
}
