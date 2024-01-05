package com.tencent.cloud.tuikit.roomkit.viewmodel;

import static com.tencent.cloud.tuikit.roomkit.model.RoomConstant.USER_NOT_FOUND;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomKitUIEvent.DISMISS_USER_MANAGEMENT;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant.KEY_USER_POSITION;

import android.content.Context;
import android.content.res.Configuration;
import android.text.TextUtils;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.UserControlPanel.UserListPanel;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class UserListViewModel
        implements RoomEventCenter.RoomEngineEventResponder, RoomEventCenter.RoomKitUIEventResponder {
    private static final String TAG             = "UserListViewModel";
    private static final int    SEAT_INDEX      = -1;
    private static final int    INVITE_TIME_OUT = 0;

    private final Context       mContext;
    private final RoomStore     mRoomStore;
    private final UserListPanel mUserListView;
    private final TUIRoomEngine mRoomEngine;

    private List<UserEntity> mUserModelList;
    private boolean mIsUserManagementPanelShowed = false;

    public UserListViewModel(Context context, UserListPanel userListView) {
        mContext = context;
        mUserListView = userListView;
        mRoomEngine = RoomEngineManager.sharedInstance(context).getRoomEngine();
        mRoomStore = RoomEngineManager.sharedInstance(mContext).getRoomStore();

        initUserModelList();
        subscribeEvent();
        Log.d(TAG, "UserListViewModel new : " + this);
    }

    public void updateViewInitState() {
        mUserListView.updateMuteVideoView(mRoomStore.roomInfo.isCameraDisableForAllUser);
        mUserListView.updateMuteAudioView(mRoomStore.roomInfo.isMicrophoneDisableForAllUser);
        mUserListView.updateMemberCount(mRoomStore.getTotalUserCount());
        mUserListView.updateViewForRole(mRoomStore.userModel.role);
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.ALL_USER_CAMERA_DISABLE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.ALL_USER_MICROPHONE_DISABLE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_ROLE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_CAMERA_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_MIC_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_ENTER_ROOM, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_ROOM, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_TAKE_SEAT, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_SEAT, this);

        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT, this);
        eventCenter.subscribeUIEvent(DISMISS_USER_MANAGEMENT, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.INVITE_TAKE_SEAT, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.CONFIGURATION_CHANGE, this);
    }

    public void destroy() {
        unSubscribeEvent();
        Log.d(TAG, "UserListViewModel destroy : " + this);
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.ALL_USER_CAMERA_DISABLE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.ALL_USER_MICROPHONE_DISABLE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_ROLE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_CAMERA_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_MIC_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_ENTER_ROOM, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_ROOM, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_TAKE_SEAT, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REMOTE_USER_LEAVE_SEAT, this);

        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT, this);
        eventCenter.unsubscribeUIEvent(DISMISS_USER_MANAGEMENT, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.INVITE_TAKE_SEAT, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.CONFIGURATION_CHANGE, this);
    }

    private void initUserModelList() {
        mUserModelList = mRoomStore.allUserList;
    }

    public void muteAllUserAudio() {
        RoomEngineManager.sharedInstance().disableDeviceForAllUserByAdmin(TUIRoomDefine.MediaDevice.MICROPHONE,
                !mRoomStore.roomInfo.isMicrophoneDisableForAllUser, null);
    }

    public void muteAllUserVideo() {
        RoomEngineManager.sharedInstance().disableDeviceForAllUserByAdmin(TUIRoomDefine.MediaDevice.CAMERA,
                !mRoomStore.roomInfo.isCameraDisableForAllUser, null);
    }

    public List<UserEntity> getUserList() {
        return mUserModelList;
    }

    public List<UserEntity> searchUserByKeyWords(String keyWords) {
        if (TextUtils.isEmpty(keyWords)) {
            return new ArrayList<>();
        }

        List<UserEntity> searchList = new ArrayList<>();
        for (UserEntity item : mRoomStore.allUserList) {
            if (item.getUserName().contains(keyWords) || item.getUserId().contains(keyWords)) {
                searchList.add(item);
            }
        }
        return searchList;
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        switch (event) {
            case ALL_USER_CAMERA_DISABLE_CHANGED:
                onAllUserCameraDisableChanged(params);
                break;
            case ALL_USER_MICROPHONE_DISABLE_CHANGED:
                onAllUserMicrophoneDisableChanged(params);
                break;
            case USER_ROLE_CHANGED:
                onUserRoleChange(params);
                break;
            case USER_CAMERA_STATE_CHANGED:
                onUserCameraStateChanged(params);
                break;
            case USER_MIC_STATE_CHANGED:
                onUserMicStateChanged(params);
                break;
            case REMOTE_USER_ENTER_ROOM:
                onRemoteUserEnterRoom(params);
                mUserListView.updateMemberCount(mRoomStore.getTotalUserCount());
                break;
            case REMOTE_USER_LEAVE_ROOM:
                onRemoteUserLeaveRoom(params);
                mUserListView.updateMemberCount(mRoomStore.getTotalUserCount());
                break;
            case REMOTE_USER_TAKE_SEAT:
            case REMOTE_USER_LEAVE_SEAT:
                onRemoteUserSeatStateChanged(params);
                break;
            default:
                break;
        }
    }

    private void onAllUserCameraDisableChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        boolean isDisable = (Boolean) params.get(RoomEventConstant.KEY_IS_DISABLE);
        mUserListView.toastForAllVideoDisableState(isDisable);
        if (mRoomStore.userModel.role != TUIRoomDefine.Role.GENERAL_USER) {
            mUserListView.updateMuteVideoView(isDisable);
        }
    }

    private void onAllUserMicrophoneDisableChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        boolean isDisable = (Boolean) params.get(RoomEventConstant.KEY_IS_DISABLE);
        mUserListView.toastForAllAudioDisableState(isDisable);
        if (mRoomStore.userModel.role != TUIRoomDefine.Role.GENERAL_USER) {
            mUserListView.updateMuteAudioView(isDisable);
        }
    }

    private void onUserRoleChange(Map<String, Object> params) {
        if (params == null) {
            return;
        }

        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        UserEntity changeUser = mRoomStore.allUserList.get(position);
        if (TextUtils.equals(mRoomStore.userModel.userId, changeUser.getUserId())) {
            mUserListView.updateViewForRole(mRoomStore.userModel.role);
        } else {
            mUserListView.notifyUserStateChanged(position);
        }
    }

    private void onUserCameraStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        mUserListView.notifyUserStateChanged(position);
    }

    private void onUserMicStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        mUserListView.notifyUserStateChanged(position);
    }

    private void onRemoteUserEnterRoom(Map<String, Object> params) {
        if (params == null) {
            return;
        }

        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        mUserListView.notifyUserEnter(position);
    }

    private void onRemoteUserLeaveRoom(Map<String, Object> params) {
        if (params == null) {
            return;
        }

        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        mUserListView.notifyUserExit(position);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        switch (key) {
            case RoomEventCenter.RoomKitUIEvent.SHOW_USER_MANAGEMENT:
                if (mIsUserManagementPanelShowed || params == null) {
                    break;
                }
                UserEntity user = (UserEntity) params.get(RoomEventConstant.KEY_USER_MODEL);
                if (user == null) {
                    break;
                }
                mIsUserManagementPanelShowed = true;
                mUserListView.showUserManagementView(user);
                break;

            case DISMISS_USER_MANAGEMENT:
                mIsUserManagementPanelShowed = false;
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
            case RoomEventCenter.RoomKitUIEvent.CONFIGURATION_CHANGE:
                if (params == null || !mUserListView.isShowing()) {
                    break;
                }
                Configuration configuration = (Configuration) params.get(RoomEventConstant.KEY_CONFIGURATION);
                mUserListView.changeConfiguration(configuration);
                break;
            default:
                break;
        }
    }

    private void inviteUserOnSeat(final String userId) {
        UserEntity userEntity = mRoomStore.findUserWithCameraStream(mUserModelList, userId);
        if (userEntity == null) {
            return;
        }
        ToastUtil.toastShortMessageCenter(mContext.getString(R.string.tuiroomkit_toast_invite_audience_to_stage));
        mRoomEngine.takeUserOnSeatByAdmin(SEAT_INDEX, userId, INVITE_TIME_OUT, new TUIRoomDefine.RequestCallback() {
            @Override
            public void onAccepted(String requestId, String userId) {
                ToastUtil.toastShortMessageCenter(
                        mContext.getString(R.string.tuiroomkit_accept_invite, userEntity.getUserName()));
            }

            @Override
            public void onRejected(String requestId, String userId, String message) {
                ToastUtil.toastShortMessageCenter(
                        mContext.getString(R.string.tuiroomkit_reject_invite, userEntity.getUserName()));
            }

            @Override
            public void onCancelled(String requestId, String userId) {
                Log.e(TAG, "takeSeat onRejected requestId : " + requestId + ",userId:" + userId);
            }

            @Override
            public void onTimeout(String requestId, String userId) {
                Log.e(TAG, "takeSeat onTimeout userId : " + userId);
            }

            @Override
            public void onError(String requestId, String userId, TUICommonDefine.Error code, String message) {
                Log.e(TAG, "takeSeat onError userId:" + userId + ",code : " + code + ",message:" + message);
            }
        });
    }

    private void onRemoteUserSeatStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        int position = (int) params.get(KEY_USER_POSITION);
        if (position == USER_NOT_FOUND) {
            return;
        }
        mUserListView.notifyUserStateChanged(position);
    }
}
