import TUIRoomInfo from './base/TUIRoomInfo';
import TUIRoomUser from './base/TUIRoomUser';

class StateStore {
  currentUser!: TUIRoomUser;

  userMap!: Map<string, TUIRoomUser>;

  roomInfo!: TUIRoomInfo;

  constructor() {
    this.init();
  }

  private init() {
    this.currentUser = new TUIRoomUser();
    this.userMap = new Map<string, TUIRoomUser>();
    this.roomInfo = new TUIRoomInfo();
  }

  reset() {
    this.init();
  }
}

export default StateStore;
