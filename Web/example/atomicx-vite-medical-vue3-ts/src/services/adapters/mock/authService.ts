import { mockUserService } from '@/services/adapters/mock/userService';
import type {
  AuthService,
  LaunchContext,
  SessionData,
} from '@/services/adapters/types';

function buildMockSession(context: LaunchContext): SessionData {
  return {
    role: context.role,
    userId: context.userId,
    appointmentId: context.appointmentId,
    token: context.token,
    launchMode: 'mock',
    user:
      mockUserService.getUserById(context.userId) || {
        userId: context.userId,
        userName: context.userName || context.userId,
        avatarUrl: context.avatarUrl || '',
        role: context.role,
      },
  };
}

export const mockAuthService: AuthService = {
  getLaunchContext() {
    return null;
  },
  async login(context) {
    return buildMockSession(context);
  },
  async logout() {},
};
