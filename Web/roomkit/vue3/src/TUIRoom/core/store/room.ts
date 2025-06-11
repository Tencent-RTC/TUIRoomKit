import { ref, Ref, computed, ComputedRef, reactive } from 'vue';
import {
  TUIRoomInfo,
  TUIVideoStreamType,
  TUIRequest,
} from '@tencentcloud/tuiroom-engine-js';
import { RoomState, UserInfo, StreamInfo } from '../type';
import { set, del } from '../../utils/vue';
import { getNewStreamInfo, setStreamListSortComparator } from './utils/stream';
import {
  getNewUserInfo,
  setUserListSortComparator,
  getUserListSortComparator,
} from './utils/user';
import { Comparator } from '../../utils/utils';

const roomState: Ref<RoomState> = ref(RoomState.Idle);
const roomId: Ref<string> = ref('');
const roomInfo: Ref<TUIRoomInfo | undefined> = ref();
const userInfoObj: Ref<Record<string, UserInfo>> = ref({});
const streamInfoObj: Ref<Record<string, StreamInfo>> = ref({});
const localUserId = ref('');

const userSearchText = ref('');

const seatApplicationRequestList: Ref<TUIRequest[]> = ref([]);
const seatInvitationRequest: Ref<TUIRequest | null> = ref(null);

// const loggedUserInfo: Ref<{ userid } = ref({
//   userId: '',
//   nickName: '',
//   avatarUrl: '',
// });

const localUser: ComputedRef<UserInfo> = computed(
  () => userInfoObj.value[localUserId.value]
);
const localStream = computed(
  () =>
    streamInfoObj.value[
      `${localUserId.value}_${TUIVideoStreamType.kCameraStream}`
    ]
);

const userList: ComputedRef<UserInfo[]> = computed(() => {
  return [...Object.values(userInfoObj.value)].sort(
    getUserListSortComparator({ localUserId: localUserId.value })
  );
});

const onSeatUserList = computed(() => {
  return userList.value.filter(item => item.isOnSeat);
});
const remoteUserList: ComputedRef<UserInfo[]> = computed(() => {
  return [...Object.values(userInfoObj.value)].filter(
    item => item.userId !== localUserId.value
  );
});
const applyToOnSeatUserList: ComputedRef<UserInfo[]> = computed(() => {
  const applyToOnSeatUserIdList = seatApplicationRequestList.value.map(
    item => item.userId
  );
  return applyToOnSeatUserIdList
    .map(userId => userInfoObj.value[userId])
    .sort((item1, item2) => item1.timestamp - item2.timestamp);
});

export function setRoomState(state: RoomState) {
  roomState.value = state;
}

export function setRoomInfo(data: Partial<TUIRoomInfo>) {
  const newRoomInfo = { ...roomInfo.value, ...data };
  roomInfo.value = newRoomInfo;
  if (roomInfo.value?.roomId) {
    roomId.value = roomInfo.value.roomId;
  }
}

export function setLocalUser(options: { userId: string }) {
  localUserId.value = options.userId;
}

export function addUserInfo(
  userInfo: Pick<UserInfo, 'userId'> & Partial<UserInfo>
) {
  const { userId } = userInfo;
  if (!userId) {
    return;
  }
  let newUserInfo: UserInfo;
  if (userInfoObj.value[userId]) {
    newUserInfo = Object.assign(userInfoObj.value[userId], userInfo);
  } else {
    newUserInfo = Object.assign(getNewUserInfo(userId), userInfo);
  }
  newUserInfo.displayName = getDisplayName(newUserInfo);
  userInfoObj.value[userId] = newUserInfo;
}

export function updateUserInfo(
  userInfo: Pick<UserInfo, 'userId'> & Partial<UserInfo>
) {
  if (!userInfo.userId) {
    return;
  }
  const newUserInfo: UserInfo = Object.assign(
    userInfoObj.value[userInfo.userId],
    userInfo
  );
  newUserInfo.displayName = getDisplayName(newUserInfo);
  userInfoObj.value[userInfo.userId] = newUserInfo;
}

function removeUserInfo(userId: string) {
  if (!userId || userId === localUserId.value) {
    return;
  }
  if (userInfoObj.value[userId]) {
    delete userInfoObj.value[userId];
  }
}

function getUserInfo(options: { userId: string }) {
  return userInfoObj.value[options.userId];
}

function getRecordStreamType(streamType: TUIVideoStreamType) {
  if (streamType === TUIVideoStreamType.kCameraStreamLow) {
    return TUIVideoStreamType.kCameraStream;
  }
  return streamType;
}
function addStreamInfo(userId: string, streamType: TUIVideoStreamType) {
  const recordStreamType = getRecordStreamType(streamType);
  if (streamInfoObj.value[`${userId}_${recordStreamType}`]) {
    return;
  }
  const newStreamInfo = getNewStreamInfo(userId, recordStreamType);
  set(streamInfoObj.value, `${userId}_${recordStreamType}`, newStreamInfo);
}
function updateStreamInfo(
  streamInfo: Pick<StreamInfo, 'userId' | 'streamType'> & Partial<StreamInfo>
) {
  const { userId, streamType } = streamInfo;
  const recordStreamType = getRecordStreamType(streamType);
  if (!streamInfoObj.value[`${userId}_${recordStreamType}`]) {
    return;
  }
  if (streamType !== recordStreamType) {
    Object.assign(streamInfo, { streamType: recordStreamType });
  }
  set(
    streamInfoObj.value,
    `${userId}_${recordStreamType}`,
    Object.assign(
      streamInfoObj.value[`${userId}_${recordStreamType}`],
      streamInfo
    )
  );
}
function removeStreamInfo(userId: string, streamType: TUIVideoStreamType) {
  const recordStreamType = getRecordStreamType(streamType);
  if (streamInfoObj.value[`${userId}_${recordStreamType}`]) {
    del(streamInfoObj.value, `${userId}_${recordStreamType}`);
  }
}

function getStreamInfo(userId: string, streamType: TUIVideoStreamType) {
  const recordStreamType = getRecordStreamType(streamType);
  if (streamInfoObj.value[`${userId}_${recordStreamType}`]) {
    return streamInfoObj.value[`${userId}_${recordStreamType}`];
  }
}

function addSeatApplicationRequest(request: TUIRequest) {
  seatApplicationRequestList.value.push(request);
}

function removeSeatApplicationRequest(request: TUIRequest) {
  seatApplicationRequestList.value = seatApplicationRequestList.value.filter(
    (item: TUIRequest) => item.requestAction !== request.requestAction
  );
}

function setSeatInvitationRequest(request: TUIRequest | null) {
  seatInvitationRequest.value = request;
}

function getDisplayName(options: UserInfo) {
  const { nameCard, userName, userId } = options;
  return nameCard || userName || userId;
}

function reset() {
  roomId.value = '';
  roomState.value = RoomState.Idle;
  roomInfo.value = undefined;
  userInfoObj.value = {};
  streamInfoObj.value = {};
}

const store = reactive({
  roomId,
  roomState,
  roomInfo,

  setRoomInfo,

  userInfoObj,
  userList,
  localUser,
  remoteUserList,
  streamInfoObj,
  localStream,
  onSeatUserList,
  applyToOnSeatUserList,
  userSearchText,

  seatApplicationRequestList,
  seatInvitationRequest,

  setLocalUser,
  addUserInfo,
  updateUserInfo,
  getUserInfo,
  removeUserInfo,
  addStreamInfo,
  updateStreamInfo,
  removeStreamInfo,
  reset,

  addSeatApplicationRequest,
  removeSeatApplicationRequest,
  setSeatInvitationRequest,
});

export default function useStore(options?: {
  sortUserBy: Comparator<UserInfo>;
  sortStreamBy: Comparator<StreamInfo>;
}) {
  if (options?.sortUserBy) {
    setUserListSortComparator(options?.sortUserBy);
  }
  if (options?.sortStreamBy) {
    setStreamListSortComparator(options?.sortStreamBy);
  }
  return {
    store,

    roomId,
    roomState,
    roomInfo,

    userInfoObj,
    userList,
    localUser,
    remoteUserList,
    streamInfoObj,
    localStream,
    onSeatUserList,
    applyToOnSeatUserList,
    userSearchText,

    seatApplicationRequestList,
    seatInvitationRequest,
  };
}
