import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min';

const DEFAULT_EXPIRE_TIME = 604800;

export interface GenTestUserSigParams {
  userId: string;
  sdkAppId: number;
  secretKey: string;
  expireTime?: number;
}

export interface GenTestUserSigResult {
  sdkAppId: number;
  userId: string;
  userSig: string;
}

/**
 * Generate UserSig locally for development debugging only.
 * Do not use secretKey in client-side code in production.
 */
export function genTestUserSig({
  userId,
  sdkAppId,
  secretKey,
  expireTime = DEFAULT_EXPIRE_TIME,
}: GenTestUserSigParams): GenTestUserSigResult {
  const generator = new LibGenerateTestUserSig(sdkAppId, secretKey, expireTime);
  const userSig = generator.genTestUserSig(userId);

  return {
    sdkAppId,
    userId,
    userSig,
  };
}

export default genTestUserSig;
