import { MEDICAL_MODE } from '@/config/runtime-config';
import { integrationAppointmentService } from '@/services/adapters/integration/appointmentService';
import { integrationAuthService } from '@/services/adapters/integration/authService';
import { integrationUserService } from '@/services/adapters/integration/userService';
import { mockAppointmentService } from '@/services/adapters/mock/appointmentService';
import { mockAuthService } from '@/services/adapters/mock/authService';
import { mockUserService } from '@/services/adapters/mock/userService';
import type { MedicalServiceAdapter } from '@/services/adapters/types';

const mockServices: MedicalServiceAdapter = {
  auth: mockAuthService,
  user: mockUserService,
  appointment: mockAppointmentService,
};

const integrationServices: MedicalServiceAdapter = {
  auth: integrationAuthService,
  user: integrationUserService,
  appointment: integrationAppointmentService,
};

export const services =
  MEDICAL_MODE === 'integration' ? integrationServices : mockServices;

export * from '@/services/adapters/types';
