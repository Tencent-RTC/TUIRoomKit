import { useUserActions } from './useUserActions';
import useRoomStore from '../../store/room.ts';
import RoomManager from '../../manager/roomManager';

export default function useUserState() {
  const {
    store,
    userList,
    localUser,
    onSeatUserList,
    remoteUserList,
    applyToOnSeatUserList,
    seatApplicationRequestList,
    seatInvitationRequest,
    userSearchText,
  } = useRoomStore();
  new RoomManager({ store });
  return {
    useUserActions,
    userList,
    localUser,
    remoteUserList,
    onSeatUserList,
    applyToOnSeatUserList,

    seatApplicationRequestList,
    seatInvitationRequest,

    userSearchText,

    // loadMoreUserInfo: roomManager.loadMoreUserInfo,
    // setUserListSortFn: roomManager.setUserListSortFn,
  };
}
