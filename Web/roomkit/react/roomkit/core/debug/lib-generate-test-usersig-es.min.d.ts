export default class LibGenerateTestUserSig {
  constructor(sdkAppId: number, secretKey: string, expireTime: number);
  genTestUserSig(userId: string): string;
}
