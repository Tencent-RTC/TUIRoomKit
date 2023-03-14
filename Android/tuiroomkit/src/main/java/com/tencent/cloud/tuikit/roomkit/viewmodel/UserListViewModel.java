package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.model.utils.CommonUtils;

import com.tencent.cloud.tuikit.roomkit.view.component.UserListView;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UserListViewModel implements RoomEventCenter.RoomEngineEventResponder,
        RoomEventCenter.RoomKitUIEventResponder {
    private static final String TAG                     = "UserListViewModel";
    private static final int    SEAT_INDEX              = -1;
    private static final int    INVITE_TIME_OUT         = 0;
    private static final long   USER_LIST_NEXT_SEQUENCE = 100L;

    private final Context       mContext;
    private final RoomStore     mRoomStore;
    private final UserListView  mUserListView;
    private final TUIRoomEngine mRoomEngine;

    private List<UserModel>        mUserModelList;
    private Map<String, UserModel> mUserModelMap;

    public UserListViewModel(Context context, UserListView userListView) {
        mContext = context;
        mUserListView = userListView;
        mRoomEngine = RoomEngineManager.sharedInstance(context).getRoomEngine();
        mRoomStore = RoomEngineManager.sharedInstance(mContext).getRoomStore();

        mUserModelList = new ArrayList<>();
        mUserModelMap = new HashMap<>();

        mUserListView.updateMuteVideoView(!mRoomStore.roomInfo.enableVideo);
        mUserListView.updateMuteAudioView(!mRoomStore.roomInfo.enableAudio);
        initUserModelList();
        subscribeEvent();
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_INFO_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_ENTER_ROOM, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_ROOM, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.SEAT_LIST_CHANGED, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.INVITE_TAKE_SEAT, this);
    }

    public void destroy() {
        unSubscribeEvent();
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_INFO_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_ENTER_ROOM, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_ROOM, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.SEAT_LIST_CHANGED, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.INVITE_TAKE_SEAT, this);
    }

    private void addMemberEntity(UserModel userModel) {
        if (userModel == null) {
            return;
        }
        if (findUserModel(userModel.userId) != null) {
            return;
        }
        mUserModelList.add(userModel);
        mUserModelMap.put(userModel.userId, userModel);
        mUserListView.addItem(userModel);
    }

    private UserModel findUserModel(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return null;
        }
        for (UserModel entity : mUserModelList) {
            if (entity == null) {
                continue;
            }
            if (userId.equals(entity.userId)) {
                return entity;
            }
        }
        return null;
    }

    private void removeMemberEntity(String userId) {
        UserModel userModel = mUserModelMap.remove(userId);
        if (userModel != null) {
            mUserModelList.remove(userModel);
        }
        mUserListView.removeItem(userModel);
    }

    private void initUserModelList() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                mUserListView.setOwner(isOwner());
                mRoomEngine.getSeatList(new TUIRoomDefine.GetSeatListCallback() {
                    @Override
                    public void onSuccess(List<TUIRoomDefine.SeatInfo> list) {
                        for (TUIRoomDefine.SeatInfo seatInfo : list) {
                            mRoomEngine.getUserInfo(seatInfo.userId, new TUIRoomDefine.GetUserInfoCallback() {
                                @Override
                                public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                                    UserModel userModel = new UserModel();
                                    userModel.userId = userInfo.userId;
                                    userModel.userName = userInfo.userName;
                                    userModel.userAvatar = userInfo.avatarUrl;
                                    userModel.isAudioAvailable = userInfo.hasAudioStream;
                                    userModel.isVideoAvailable = userInfo.hasVideoStream;
                                    userModel.isOnSeat = true;
                                    userModel.role = userInfo.userRole;
                                    addMemberEntity(userModel);
                                    updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                                            userInfo.avatarUrl);
                                }

                                @Override
                                public void onError(TUICommonDefine.Error error, String s) {

                                }
                            });
                        }
                        if (mRoomStore.roomInfo.enableSeatControl) {
                            initListByUserList();
                        }
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {

                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    private void initListByUserList() {
        mRoomEngine.getUserList(USER_LIST_NEXT_SEQUENCE, new TUIRoomDefine.GetUserListCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.UserListResult userListResult) {
                for (TUIRoomDefine.UserInfo userInfo : userListResult.userInfoList) {
                    UserModel userModel = new UserModel();
                    userModel.userId = userInfo.userId;
                    userModel.userName = userInfo.userName;
                    userModel.userAvatar = userInfo.avatarUrl;
                    userModel.isAudioAvailable = userInfo.hasAudioStream;
                    userModel.isVideoAvailable = userInfo.hasVideoStream;
                    userModel.isOnSeat = false;
                    userModel.role = userInfo.userRole;
                    addMemberEntity(userModel);
                    updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                            userInfo.avatarUrl);
                }
                if (userListResult.nextSequence != 0) {
                    initListByUserList();
                }
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {
                Log.e(TAG, "getUserList error,code:" + error + ",msg:" + s);
            }
        });
    }

    private void updateRemoteUserInfo(String userId, String userName, String userAvatar) {
        UserModel userModel = findUserModel(userId);
        if (userModel == null) {
            return;
        }
        userModel.userId = userId;
        userModel.userName = userName;
        userModel.userAvatar = userAvatar;
        mUserListView.updateItem(userModel);
    }

    private void updateUserEntityList(TUIRoomDefine.SeatInfo info) {
        String userId = info.userId;
        final UserModel userModel = new UserModel();
        userModel.userId = userId;
        userModel.isOnSeat = true;
        addMemberEntity(userModel);
        mRoomEngine.getUserInfo(userId, new TUIRoomDefine.GetUserInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                userModel.userName = userInfo.userName;
                userModel.userAvatar = userInfo.avatarUrl;
                userModel.role = userInfo.userRole;
                boolean isChangeSort = userModel.role == TUIRoomDefine.Role.ROOM_OWNER;
                if (isChangeSort) {
                    Collections.sort(mUserModelList, new Comparator<UserModel>() {
                        @Override
                        public int compare(UserModel o1, UserModel o2) {
                            if (o1.role == TUIRoomDefine.Role.ROOM_OWNER) {
                                return -1;
                            }
                            return 1;
                        }
                    });
                }
                updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                        userInfo.avatarUrl);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    public String getSelfUserId() {
        return mRoomStore.userModel.userId;
    }

    public void muteAllUserAudio() {
        if (!isOwner()) {
            return;
        }
        boolean isMute = mRoomStore.roomInfo.enableAudio;
        if (isMute) {
            onMuteAllUserAudio();
        } else {
            onUnMuteAllUserAudio();
        }
        mUserListView.updateMuteAudioView(isMute);
    }

    private boolean isOwner() {
        return TUIRoomDefine.Role.ROOM_OWNER.equals(mRoomStore.userModel.role);
    }

    private void onMuteAllUserAudio() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableAudio = false;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mUserListView.disableMuteAllAudio(true);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String message) {
                        Log.e(TAG, "updateRoomInfo onError error:" + error + ",msg:" + message);
                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "getRoomInfo onError error:" + error + "msg:" + message);
            }
        });
    }

    private void onUnMuteAllUserAudio() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableAudio = true;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mUserListView.disableMuteAllAudio(false);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {

                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    public void muteAllUserVideo() {
        if (!isOwner()) {
            return;
        }

        boolean isMute = mRoomStore.roomInfo.enableVideo;
        if (isMute) {
            onMuteAllVideo();
        } else {
            onUnMuteAllUserVideo();
        }
        mUserListView.updateMuteVideoView(isMute);
    }

    public void horizontalAnimation(boolean isShowingView) {
        CommonUtils.horizontalAnimation(mUserListView, isShowingView);
    }

    public List<UserModel> getUserList() {
        return mUserModelList;
    }

    public List<UserModel> searchUserByName(String userName) {
        List<UserModel> searchList = new ArrayList<>();
        UserModel userModel = findUserModelByName(userName);
        if (userModel == null) {
            return null;
        }
        searchList.add(userModel);
        return searchList;
    }

    private UserModel findUserModelByName(String userName) {
        if (TextUtils.isEmpty(userName)) {
            return null;
        }
        for (UserModel model : mUserModelList) {
            if (model == null) {
                continue;
            }
            if (userName.equals(model.userName)) {
                return model;
            }
        }
        return null;
    }

    private void onMuteAllVideo() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableVideo = false;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mUserListView.disableMuteAllVideo(true);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String message) {
                        Log.e(TAG, "updateRoomInfo onError error:" + error + "msg:" + message);
                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "getRoomInfo onError error:" + error + "msg:" + message);
            }
        });
    }

    private void onUnMuteAllUserVideo() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableVideo = true;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mUserListView.disableMuteAllVideo(false);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {

                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        switch (event) {
            case ROOM_INFO_CHANGED:
                onRoomInfoChanged(params);
                break;
            case USER_VIDEO_STATE_CHANGED:
                onUserVideoStateChanged(params);
                break;
            case USER_AUDIO_STATE_CHANGED:
                onUserAudioStateChanged(params);
                break;
            case REMOTE_USER_ENTER_ROOM:
                onRemoteUserEnterRoom(params);
                break;
            case REMOTE_USER_LEAVE_ROOM:
                onRemoteUserLeaveRoom(params);
                break;
            case SEAT_LIST_CHANGED:
                onSeatListChanged(params);
                break;
            default:
                break;
        }
    }

    private void onRoomInfoChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        TUIRoomDefine.RoomInfo roomInfo = (TUIRoomDefine.RoomInfo) params.get(RoomEventConstant.KEY_ROOM_INFO);
        if (roomInfo == null) {
            return;
        }
        if (!roomInfo.roomId.equals(mRoomStore.roomInfo.roomId)) {
            return;
        }

        boolean isOwnerChange = (boolean) params.get(RoomEventConstant.KEY_OWNER_CHANGE);
        if (isOwnerChange) {
            boolean isOwner = mRoomStore.userModel.userId.equals(roomInfo.owner);
            mUserListView.setOwner(isOwner);
            mUserListView.updateMuteVideoView(!mRoomStore.roomInfo.enableVideo);
            mUserListView.updateMuteAudioView(!mRoomStore.roomInfo.enableAudio);
        }

        boolean isVideoEnableChange = (boolean) params.get(RoomEventConstant.KEY_ENABLE_VIDEO);
        if (isVideoEnableChange && !isOwner()) {
            mUserListView.disableMuteAllVideo(!roomInfo.enableVideo);
        }
        boolean isAudioEnableChange = (boolean) params.get(RoomEventConstant.KEY_ENABLE_AUDIO);
        if (isAudioEnableChange && !isOwner()) {
            mUserListView.disableMuteAllAudio(!roomInfo.enableAudio);
        }
    }

    private void onUserVideoStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        TUIRoomDefine.VideoStreamType streamType = (TUIRoomDefine.VideoStreamType)
                params.get(RoomEventConstant.KEY_STREAM_TYPE);
        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(streamType)) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        UserModel userModel = findUserModel(userId);
        if (userModel == null) {
            return;
        }
        userModel.isVideoAvailable = (boolean) params.get(RoomEventConstant.KEY_HAS_VIDEO);
        mUserListView.updateItem(userModel);
    }

    private void onUserAudioStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        UserModel userModel = findUserModel(userId);
        if (userModel == null) {
            return;
        }
        userModel.isAudioAvailable = (boolean) params.get(RoomEventConstant.KEY_HAS_AUDIO);
        mUserListView.updateItem(userModel);
    }

    private void onRemoteUserEnterRoom(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        if (!mRoomStore.roomInfo.enableSeatControl) {
            return;
        }
        TUIRoomDefine.UserInfo userInfo = (TUIRoomDefine.UserInfo) params.get(RoomEventConstant.KEY_USER_INFO);
        if (userInfo == null) {
            return;
        }
        UserModel userModel = new UserModel();
        userModel.userId = userInfo.userId;
        userModel.userName = userInfo.userName;
        userModel.userAvatar = userInfo.avatarUrl;
        userModel.isAudioAvailable = userInfo.hasAudioStream;
        userModel.isVideoAvailable = userInfo.hasVideoStream;
        userModel.role = userInfo.userRole;
        addMemberEntity(userModel);
        updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                userInfo.avatarUrl);
    }

    private void onRemoteUserLeaveRoom(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        if (!mRoomStore.roomInfo.enableSeatControl) {
            return;
        }
        TUIRoomDefine.UserInfo userInfo = (TUIRoomDefine.UserInfo) params.get(RoomEventConstant.KEY_USER_INFO);
        if (userInfo == null) {
            return;
        }
        removeMemberEntity(userInfo.userId);
    }

    private void onSeatListChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        List<TUIRoomDefine.SeatInfo> userSeatedList = (List<TUIRoomDefine.SeatInfo>)
                params.get(RoomEventConstant.KEY_SEATED_LIST);

        if (userSeatedList != null && !userSeatedList.isEmpty()) {
            for (TUIRoomDefine.SeatInfo info :
                    userSeatedList) {
                if (mRoomStore.roomInfo.enableSeatControl) {
                    updateUserSeatedState(info.userId, true);
                } else {
                    updateUserEntityList(info);
                }
            }
        }

        List<TUIRoomDefine.SeatInfo> userLeftList = (List<TUIRoomDefine.SeatInfo>)
                params.get(RoomEventConstant.KEY_LEFT_LIST);
        if (userLeftList != null && !userLeftList.isEmpty()) {
            for (TUIRoomDefine.SeatInfo info :
                    userLeftList) {
                if (mRoomStore.roomInfo.enableSeatControl) {
                    updateUserSeatedState(info.userId, false);
                } else {
                    removeMemberEntity(info.userId);
                }
            }
        }
    }

    private void updateUserSeatedState(String userId, boolean isOnSeat) {
        UserModel userModel = findUserModel(userId);
        if (userModel == null) {
            return;
        }
        userModel.isOnSeat = isOnSeat;
        mUserListView.updateItem(userModel);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        switch (key) {
            case RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT:
                if (params == null) {
                    break;
                }
                UserModel userModel = (UserModel) params.get(RoomEventConstant.KEY_USER_MODEL);
                if (userModel == null) {
                    break;
                }
                mUserListView.showUserManagementView(userModel);
                break;
            case RoomEventCenter.RoomKitUIEvent.INVITE_TAKE_SEAT:
                if (params == null) {
                    break;
                }
                String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
                if (TextUtils.isEmpty(userId)) {
                    break;
                }
                inviteUserOnSeat(userId);
                break;
            default:
                break;
        }
    }

    private void inviteUserOnSeat(final String userId) {
        final UserModel userModel = findUserModel(userId);
        if (userModel == null) {
            return;
        }
        ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_toast_invite_audience_to_stage));
        mRoomEngine.requestRemoteUserOnSeat(SEAT_INDEX, userId, INVITE_TIME_OUT, new TUIRoomDefine.RequestCallback() {
            @Override
            public void onAccepted(int i, String s) {
                ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_accept_invite, userModel.userName));
            }

            @Override
            public void onRejected(int i, String s, String s1) {
                ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_reject_invite, userModel.userName));
            }

            @Override
            public void onCancelled(int i, String s) {

            }

            @Override
            public void onTimeout(int i, String s) {

            }

            @Override
            public void onError(int i, String s, TUICommonDefine.Error error, String s1) {

            }
        });
    }
}
