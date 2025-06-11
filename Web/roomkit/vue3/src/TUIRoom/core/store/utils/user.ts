import { TUIRole, TUIInvitationStatus } from '@tencentcloud/tuiroom-engine-js';
import {
  Comparator,
  combineComparators,
  createComparator,
} from '../../../utils/utils';
import { UserInfo } from '../../type';

export function getNewUserInfo(userId: string): UserInfo {
  const newUserInfo = {
    userId,
    userName: '',
    avatarUrl: '',
    nameCard: '',
    hasAudioStream: false,
    hasVideoStream: false,
    hasScreenStream: false,
    isMessageDisabled: false,
    userRole: TUIRole.kGeneralUser,
    customInfo: {},
    isOnSeat: false,
    isInRoom: false,
    invitationStatus: TUIInvitationStatus.kNone,
    timestamp: Date.now(),
  };
  return newUserInfo;
}

let userListCompareFunction: Comparator<UserInfo>;
export function setUserListSortComparator(comparator: Comparator<UserInfo>) {
  userListCompareFunction = comparator;
}
export function getUserListSortComparator({
  localUserId,
}: {
  localUserId: string;
}) {
  const defaultUserListCompareFunction = combineComparators(
    createComparator((userInfo: UserInfo) =>
      Boolean(userInfo.userId === localUserId)
    ),
    createComparator((userInfo: UserInfo) =>
      Boolean(userInfo.userRole === TUIRole.kRoomOwner)
    ),
    createComparator((userInfo: UserInfo) =>
      Boolean(userInfo.userRole === TUIRole.kAdministrator)
    ),
    createComparator((userInfo: UserInfo) => Boolean(userInfo.hasScreenStream)),
    createComparator((userInfo: UserInfo) =>
      Boolean(userInfo.hasVideoStream && userInfo.hasAudioStream)
    ),
    createComparator((userInfo: UserInfo) => Boolean(userInfo.hasVideoStream)),
    createComparator((userInfo: UserInfo) => Boolean(userInfo.hasAudioStream)),
    createComparator((userInfo: UserInfo) => Boolean(userInfo.isOnSeat)),
    createComparator((userInfoA: UserInfo, userInfoB: UserInfo) =>
      Boolean(Number(userInfoA.timestamp) < Number(userInfoB.timestamp))
    )
  );
  return userListCompareFunction || defaultUserListCompareFunction;
}
