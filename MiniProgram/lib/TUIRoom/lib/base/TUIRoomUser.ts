import { TUIRoomRole } from '../types';

class TUIRoomUser {
  ID = ''; // 用户ID

  name = ''; // 用户名

  nick = ''; // 用户昵称

  avatar = ''; // 用户头像url

  role = TUIRoomRole.AUDIENCE; // 用户角色


  isMicrophoneMuted = false; // 是否被禁止使用麦克风

  isCameraMuted = false; // 是否被禁止使用摄像头


  init(info: any) {
    this.ID = info.userID;
    this.nick = info.nick;
    this.avatar = info.avatar;
  }

  reset() {
    this.role = TUIRoomRole.AUDIENCE;
    this.isCameraMuted = false;
    this.isMicrophoneMuted = false;
  }
}

export default TUIRoomUser;
