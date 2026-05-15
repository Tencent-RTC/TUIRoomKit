import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min';

export const SDKAPPID = 0;
export const SDKSECRETKEY = '';
export const EXPIRETIME = 604800;

export function assertBasicInfoConfigured() {
  if (!Number(SDKAPPID) || !String(SDKSECRETKEY).trim()) {
    throw new Error(
      '请先在 src/config/basic-info-config.ts 中配置 SDKAPPID 和 SDKSECRETKEY，正式环境请由业务服务端签发 UserSig'
    );
  }
}

export function getBasicInfo(userId: string) {
  assertBasicInfoConfigured();
  const generator = new LibGenerateTestUserSig(
    SDKAPPID,
    SDKSECRETKEY,
    EXPIRETIME
  );
  return {
    sdkAppId: SDKAPPID,
    userId,
    userSig: generator.genTestUserSig(userId),
  };
}
