/*
 * @Description: Basic information configuration for TUIRoomKit applications
 */

import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min';

/**
 * Tencent Cloud SDKAppId, which should be replaced with user's SDKAppId.
 * Enter Tencent Cloud TRTC [Console] (https://console.cloud.tencent.com/trtc ) to create an application,
 * and you will see the SDKAppId.
 * It is a unique identifier used by Tencent Cloud to identify users.
 */

export const SDKAPPID = 0;

/**
 * Encryption key for calculating signature, which can be obtained in the following steps:
 *
 * Step1. Enter Tencent Cloud TRTC [Console](https://console.cloud.tencent.com/rav ),
 * and create an application if you don't have one.
 * Step2. Click your application to find "Quick Start".
 * Step3. Click "View Secret Key" to see the encryption key for calculating UserSig,
 * and copy it to the following variable.
 *
 * Notes: this method is only applicable for debugging Demo. Before official launch,
 * please migrate the UserSig calculation code and key to your backend server to avoid
 * unauthorized traffic use caused by the leakage of encryption key.
 * Document: https://intl.cloud.tencent.com/document/product/647/35166#Server
 */
export const SDKSECRETKEY = '';

/**
 * Signature expiration time, which should not be too short
 * Time unit: second
 * Default time: 7 * 24 * 60 * 60 = 604800 = 7days
 */
export const EXPIRETIME = 604800;

/**
 * Set user information on the push side
 */
export const userInfo = {
  // userId
  userId: `user_${Math.ceil(Math.random() * 100000)}`,
  // userName
  userName: 'myName',
  // userAvatar
  avatarUrl: '',
};

export function getBasicInfo() {
  if (SDKAPPID === Number(0) || SDKSECRETKEY === String('')) {
    alert('Please configure your SDKAPPID in config/basic-info-config.js');
    return;
  }
  const generator = new LibGenerateTestUserSig(SDKAPPID, SDKSECRETKEY, EXPIRETIME);
  const userSig = generator.genTestUserSig(userInfo.userId);
  const { userId, userName, avatarUrl } = userInfo;
  return {
    sdkAppId: SDKAPPID,
    userId,
    userSig,
    userName,
    avatarUrl,
  };
};
