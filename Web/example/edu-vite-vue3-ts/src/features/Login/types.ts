export interface LoginUserInfo {
  SDKAppID: number;
  userID: string;
  userSig: string;
  token?: string;
}

/** The form stays in the logging state until the returned promise settles. */
export type LoginHandler = (userInfo: LoginUserInfo) => void | Promise<unknown>;
