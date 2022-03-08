import TUIRoomConfig from './TUIRoomConfig';

class TUIRoomInfo {
  roomID = ''; // 房间ID

  ownerID = ''; // 群拥有者ID

  roomName = ''; // 房间名

  roomMemberNum = 0; // 成员个数

  roomConfig = new TUIRoomConfig();

  reset() {
    this.roomID = '';
    this.ownerID = '';
    this.roomName = '';
    this.roomMemberNum = 0;
    this.roomConfig.reset();
  }
}

export default TUIRoomInfo;
