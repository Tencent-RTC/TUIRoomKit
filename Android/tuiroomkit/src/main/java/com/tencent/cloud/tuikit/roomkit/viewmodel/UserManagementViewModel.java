package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.view.component.UserManagementView;

import java.util.List;
import java.util.Map;

public class UserManagementViewModel implements RoomEventCenter.RoomEngineEventResponder {
    private static final int SEAT_INDEX      = -1;
    private static final int INVITE_TIME_OUT = 0;
    private static final int REQ_TIME_OUT    = 15;
    private static final int MUTE_DURATION   = 24 * 60 * 60;

    private RoomStore          mRoomStore;
    private UserModel          mUserModel;
    private TUIRoomEngine      mRoomEngine;
    private UserManagementView mUserManagementView;

    public UserManagementViewModel(Context context, UserModel userModel, UserManagementView view) {
        mUserModel = userModel;
        mUserManagementView = view;
        RoomEngineManager engineManager = RoomEngineManager.sharedInstance(context);
        mRoomEngine = engineManager.getRoomEngine();
        mRoomStore = engineManager.getRoomStore();
        subscribeEvent();
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_MUTE_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.SEAT_LIST_CHANGED, this);
    }

    public void destroy() {
        unSubscribeEvent();
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_MUTE_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.SEAT_LIST_CHANGED, this);
    }

    public boolean isEnableSeatControl() {
        return mRoomStore.roomInfo.enableSeatControl;
    }

    public boolean isSelf() {
        return mRoomStore.userModel.userId.equals(mUserModel.userId);
    }

    public void muteUserAudio() {
        if (mUserModel.isAudioAvailable) {
            onMuteUserAudio(mUserModel.userId);
        } else {
            onUnMuteUserAudio(mUserModel.userId);
        }
    }

    private boolean isOwner() {
        return TUIRoomDefine.Role.ROOM_OWNER.equals(mRoomStore.userModel.role);
    }

    private void onMuteUserAudio(String userId) {
        if (userId.equals(mRoomStore.userModel.userId)) {
            mRoomEngine.stopPushLocalAudio();
            mRoomEngine.closeLocalMicrophone();
            return;
        }
        if (!isOwner()) {
            return;
        }
        mRoomEngine.closeRemoteMicrophone(userId, null);
    }

    private void onUnMuteUserAudio(String userId) {
        if (userId.equals(mRoomStore.userModel.userId)) {
            mRoomEngine.openLocalMicrophone(null);
            mRoomEngine.startPushLocalAudio();
            return;
        }
        if (!isOwner()) {
            return;
        }
        mRoomEngine.requestToOpenRemoteMicrophone(userId, REQ_TIME_OUT, null);
    }


    public void muteUserVideo() {
        if (mUserModel.isVideoAvailable) {
            onMuteUserVideo(mUserModel.userId);
        } else {
            onUnMuteUserVideo(mUserModel.userId);
        }
    }

    private void onMuteUserVideo(String userId) {
        if (userId.equals(mRoomStore.userModel.userId)) {
            mRoomEngine.stopPushLocalVideo();
            mRoomEngine.closeLocalCamera();
            return;
        }
        if (!isOwner()) {
            return;
        }
        mRoomEngine.closeRemoteCamera(userId, null);
    }

    private void onUnMuteUserVideo(String userId) {
        if (userId.equals(mRoomStore.userModel.userId)) {
            mRoomEngine.openLocalCamera(true, null);
            mRoomEngine.startPushLocalVideo();
            return;
        }
        if (!isOwner()) {
            return;
        }
        mRoomEngine.requestToOpenRemoteCamera(userId, REQ_TIME_OUT, null);
    }


    public void forwardMaster() {
        if (mUserModel == null) {
            return;
        }
        mRoomEngine.changeUserRole(mUserModel.userId, TUIRoomDefine.Role.ROOM_OWNER, null);
    }

    public void muteUser() {
        if (mUserModel == null) {
            return;
        }
        if (!mUserModel.isMute) {
            mRoomEngine.muteRemoteUser(mUserModel.userId, MUTE_DURATION, null);
        } else {
            mRoomEngine.unMuteRemoteUser(mUserModel.userId, null);
        }
        mUserModel.isMute = !mUserModel.isMute;
    }

    public void kickUser(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        mRoomEngine.kickOutRemoteUser(userId, null);
    }

    public void kickOffStage() {
        if (mUserModel == null) {
            return;
        }
        if (!mRoomStore.roomInfo.enableSeatControl || !mUserModel.isOnSeat) {
            return;
        }
        mRoomEngine.kickRemoteUserOffSeat(SEAT_INDEX, mUserModel.userId, null);
    }

    public void inviteToStage() {
        if (mUserModel == null) {
            return;
        }
        if (!mRoomStore.roomInfo.enableSeatControl || mUserModel.isOnSeat) {
            return;
        }
        mRoomEngine.requestRemoteUserOnSeat(SEAT_INDEX, mUserModel.userId, INVITE_TIME_OUT, null);
    }


    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        switch (event) {
            case USER_VIDEO_STATE_CHANGED:
                onUserVideoStateChanged(params);
                break;
            case USER_AUDIO_STATE_CHANGED:
                onUserAudioStateChanged(params);
                break;
            case USER_MUTE_STATE_CHANGED:
                onUserMuteStateChanged(params);
                break;
            case SEAT_LIST_CHANGED:
                onSeatListChanged(params);
                break;
            default:
                break;
        }
    }

    private void onUserVideoStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get("userId");
        if (TextUtils.isEmpty(userId) || !userId.equals(mUserModel.userId)) {
            return;
        }
        mUserModel.isVideoAvailable = (boolean) params.get("hasVideo");
        mUserManagementView.updateCameraState(mUserModel.isVideoAvailable);
    }

    private void onUserAudioStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get("userId");
        if (TextUtils.isEmpty(userId) || !userId.equals(mUserModel.userId)) {
            return;
        }
        mUserModel.isAudioAvailable = (boolean) params.get("hasAudio");
        mUserManagementView.updateMicState(mUserModel.isAudioAvailable);
    }

    private void onUserMuteStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get("userId");
        if (TextUtils.isEmpty(userId) || !userId.equals(mUserModel.userId)) {
            return;
        }
        mUserModel.isMute = (boolean) params.get("muted");
        mUserManagementView.updateMuteState(!mUserModel.isMute);
    }

    private void onSeatListChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        if (!mRoomStore.roomInfo.enableSeatControl) {
            return;
        }
        List<TUIRoomDefine.SeatInfo> userSeatedList = (List<TUIRoomDefine.SeatInfo>) params.get("seatedList");

        if (userSeatedList != null && !userSeatedList.isEmpty()) {
            for (TUIRoomDefine.SeatInfo info :
                    userSeatedList) {
                if (info.userId.equals(mUserModel.userId)) {
                    mUserManagementView.updateLayout(true);
                }
            }
        }

        List<TUIRoomDefine.SeatInfo> userLeftList = (List<TUIRoomDefine.SeatInfo>) params.get("leftList");
        if (userLeftList != null && !userLeftList.isEmpty()) {
            for (TUIRoomDefine.SeatInfo info :
                    userLeftList) {
                if (info.userId.equals(mUserModel.userId)) {
                    mUserManagementView.updateLayout(false);
                }
            }
        }

    }
}
