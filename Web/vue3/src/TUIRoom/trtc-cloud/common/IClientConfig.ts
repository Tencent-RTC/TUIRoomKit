interface IClientConfig {
  sdkAppId: number;
  userId: string;
  userSig: string;
  mode: string;
  useStringRoomId?: boolean;
  privateMapKey?: string;
  streamId?: string;
  frameWorkType?:number;
}

export { IClientConfig };
