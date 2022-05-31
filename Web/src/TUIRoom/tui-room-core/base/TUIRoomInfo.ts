import TUIRoomConfig from './TUIRoomConfig';

class TUIRoomInfo {
  roomId = ''; // 房间Id

  ownerId = ''; // 群拥有者Id

  roomName = ''; // 房间名

  roomMemberNum = 0; // 成员个数

  roomConfig = new TUIRoomConfig();

  reset() {
    this.roomId = '';
    this.ownerId = '';
    this.roomName = '';
    this.roomMemberNum = 0;
    this.roomConfig.reset();
  }
}

export default TUIRoomInfo;
