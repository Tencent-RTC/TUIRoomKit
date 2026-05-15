import { integrationUserService } from '@/services/adapters/integration/userService';
import { parseLaunchContextFromUrl } from '@/services/adapters/integration/launchContext';
import type {
  AuthService,
  LaunchContext,
  SessionData,
} from '@/services/adapters/types';

function buildSession(context: LaunchContext): SessionData {
  const fallbackUser =
    context.role === 'doctor'
      ? integrationUserService.getDoctorById(context.userId)
      : integrationUserService.getPatientById(context.userId);

  return {
    role: context.role,
    userId: context.userId,
    appointmentId: context.appointmentId,
    token: context.token,
    launchMode: 'integration',
    user: fallbackUser || {
      userId: context.userId,
      userName: context.userName || context.userId,
      avatarUrl: context.avatarUrl || '',
      role: context.role,
    },
  };
}

export const integrationAuthService: AuthService = {
  getLaunchContext() {
    return parseLaunchContextFromUrl();
  },
  async login(context) {
    return buildSession(context);
  },
  async logout() {},
};
