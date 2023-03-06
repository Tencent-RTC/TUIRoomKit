package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.Manifest;
import android.content.Context;
import android.os.Build;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;

import com.blankj.utilcode.util.PermissionUtils;
import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.model.utils.CommonUtils;
import com.tencent.cloud.tuikit.roomkit.view.service.ForegroundService;
import com.tencent.cloud.tuikit.roomkit.view.component.RoomMainView;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.permission.PermissionCallback;
import com.tencent.qcloud.tuicore.permission.PermissionRequester;
import com.tencent.qcloud.tuicore.util.ToastUtil;
import com.tencent.trtc.TRTCCloudDef;

import java.util.HashMap;
import java.util.Map;

public class RoomMainViewModel implements RoomEventCenter.RoomKitUIEventResponder,
        RoomEventCenter.RoomEngineEventResponder {
    private static final String TAG = "MeetingViewModel";

    private static final int SEAT_INDEX   = -1;
    private static final int REQ_TIME_OUT = 30;

    private Context       mContext;
    private RoomStore     mRoomStore;
    private TUIRoomEngine mRoomEngine;
    private RoomMainView  mRoomMainView;

    public RoomMainViewModel(Context context, RoomMainView meetingView) {
        mContext = context;
        mRoomMainView = meetingView;
        mRoomEngine = RoomEngineManager.sharedInstance(context).getRoomEngine();
        mRoomStore = RoomEngineManager.sharedInstance(context).getRoomStore();
        subscribeEvent();
        setMirror();
    }

    private void setMirror() {
        TRTCCloudDef.TRTCRenderParams param = new TRTCCloudDef.TRTCRenderParams();
        param.mirrorType = mRoomStore.videoModel.isMirror ? TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_ENABLE
                : TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_DISABLE;
        mRoomEngine.getTRTCCloud().setLocalRenderParams(param);
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_MEETING_INFO, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_LIST, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_EXTENSION_VIEW, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_QRCODE_VIEW, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_APPLY_LIST, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.START_SCREEN_SHARE, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_EXIT_ROOM_VIEW, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.LEAVE_MEETING, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.EXIT_MEETING, this);

        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_RECEIVED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_INFO_CHANGED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_SCREEN_CAPTURE_STOPPED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_ROLE_CHANGED, this);
    }

    public void initCameraAndMicrophone() {
        if (!isOwner() && mRoomStore.roomInfo.enableSeatControl) {
            return;
        }
        if (mRoomStore.roomInfo.isOpenMicrophone
                && mRoomStore.roomInfo.enableAudio) {
            PermissionCallback callback = new PermissionCallback() {
                @Override
                public void onGranted() {
                    enableMicrophone(true);
                    if (mRoomStore.roomInfo.isOpenCamera
                            && mRoomStore.roomInfo.enableVideo) {
                        requestCameraPermission();
                    }
                }
            };

            PermissionRequester.newInstance(Manifest.permission.RECORD_AUDIO)
                    .title(mContext.getString(R.string.tuiroomkit_permission_mic_reason_title,
                            CommonUtils.getAppName(mContext)))
                    .description(mContext.getString(R.string.tuiroomkit_permission_mic_reason))
                    .settingsTip(mContext.getString(R.string.tuiroomkit_tips_start_audio))
                    .callback(callback)
                    .request();
        } else if (mRoomStore.roomInfo.isOpenCamera
                && mRoomStore.roomInfo.enableVideo) {
            requestCameraPermission();
        }
    }

    private void requestCameraPermission() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                enableCamera(true);
            }
        };

        PermissionRequester.newInstance(Manifest.permission.CAMERA)
                .title(mContext.getString(R.string.tuiroomkit_permission_camera_reason_title,
                        CommonUtils.getAppName(mContext)))
                .description(mContext.getString(R.string.tuiroomkit_permission_camera_reason))
                .settingsTip(mContext.getString(R.string.tuiroomkit_tips_start_camera))
                .callback(callback)
                .request();
    }

    public void destroy() {
        unSubscribeEvent();
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_MEETING_INFO, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_LIST, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_EXTENSION_VIEW, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_QRCODE_VIEW, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_APPLY_LIST, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.START_SCREEN_SHARE, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_EXIT_ROOM_VIEW, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.LEAVE_MEETING, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.EXIT_MEETING, this);

        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_AUDIO_STATE_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_RECEIVED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_INFO_CHANGED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_SCREEN_CAPTURE_STOPPED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_ROLE_CHANGED, this);
    }

    public boolean isOwner() {
        return TUIRoomDefine.Role.ROOM_OWNER.equals(mRoomStore.userModel.role);
    }

    public void enableMicrophone(boolean enable) {
        if (enable) {
            openMicrophone();
        } else {
            mRoomEngine.stopPushLocalAudio();
            mRoomEngine.closeLocalMicrophone();
        }
    }

    private void openMicrophone() {
        if (!getRoomInfo().enableAudio) {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_can_not_open_mic));
            return;
        }
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mRoomEngine.openLocalMicrophone(null);
                mRoomEngine.startPushLocalAudio();
            }
        };

        PermissionRequester.newInstance(Manifest.permission.RECORD_AUDIO)
                .title(mContext.getString(R.string.tuiroomkit_permission_mic_reason_title,
                        CommonUtils.getAppName(mContext)))
                .description(mContext.getString(R.string.tuiroomkit_permission_mic_reason))
                .settingsTip(mContext.getString(R.string.tuiroomkit_tips_start_audio))
                .callback(callback)
                .request();
    }

    public void enableCamera(boolean enable) {
        if (enable) {
            openCamera();
        } else {
            mRoomEngine.stopPushLocalVideo();
            mRoomEngine.closeLocalCamera();
        }
    }

    private void openCamera() {
        if (!getRoomInfo().enableVideo) {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_can_not_open_camera));
            return;
        }

        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mRoomEngine.openLocalCamera(mRoomStore.videoModel.isFrontCamera, null);
                mRoomEngine.startPushLocalVideo();
            }
        };

        PermissionRequester.newInstance(Manifest.permission.CAMERA)
                .title(mContext.getString(R.string.tuiroomkit_permission_camera_reason_title,
                        CommonUtils.getAppName(mContext)))
                .description(mContext.getString(R.string.tuiroomkit_permission_camera_reason))
                .settingsTip(mContext.getString(R.string.tuiroomkit_tips_start_camera))
                .callback(callback)
                .request();
    }

    public View getVideoSeatView() {
        HashMap<String, Object> videoSeatParaMap = new HashMap<>();
        videoSeatParaMap.put("context", mContext);
        videoSeatParaMap.put("roomId", mRoomStore.roomInfo.roomId);
        videoSeatParaMap.put("roomEngine", RoomEngineManager.sharedInstance(mContext).getRoomEngine());
        Map<String, Object> videoSeatRetMap = TUICore
                .getExtensionInfo("com.tencent.cloud.tuikit.videoseat.core.TUIVideoSeatExtension",
                        videoSeatParaMap);
        if (videoSeatRetMap != null && videoSeatRetMap.size() > 0) {
            Object videoSeatView = videoSeatRetMap.get("TUIVideoSeat");
            if (videoSeatView instanceof View) {
                Log.i(TAG, "TUIVideoSeat TUIExtensionView getExtensionInfo success");
                return ((View) videoSeatView);
            } else {
                Log.e(TAG, "TUIVideoSeat TUIExtensionView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIVideoSeat getExtensionInfo null");
            return null;
        }
    }

    public void responseRequest(int requestId, boolean agree) {
        mRoomEngine.responseRemoteRequest(requestId, agree, null);
    }

    public void startScreenShare() {
        mRoomEngine.closeLocalCamera();
        ForegroundService.start(mContext);
        mRoomEngine.startScreenSharing();
    }

    public void stopScreenShare() {
        mRoomEngine.stopScreenSharing();
    }

    public RoomInfo getRoomInfo() {
        return mRoomStore.roomInfo;
    }

    public UserModel getUserModel() {
        return mRoomStore.userModel;
    }

    private void onCameraMuted(boolean muted) {
        mRoomMainView.onCameraMuted(muted);
    }

    private void onMicrophoneMuted(boolean muted) {
        mRoomMainView.onMicrophoneMuted(muted);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        switch (key) {
            case RoomEventCenter.RoomKitUIEvent.SHOW_MEETING_INFO:
                mRoomMainView.showRoomInfo();
                break;
            case RoomEventCenter.RoomKitUIEvent.SHOW_USER_LIST:
                mRoomMainView.showUserList();
                break;
            case RoomEventCenter.RoomKitUIEvent.SHOW_EXTENSION_VIEW:
                mRoomMainView.showExtensionView();
                break;
            case RoomEventCenter.RoomKitUIEvent.SHOW_EXIT_ROOM_VIEW:
                mRoomMainView.showExitRoomDialog();
                break;
            case RoomEventCenter.RoomKitUIEvent.LEAVE_MEETING:
                mRoomMainView.showTransferMasterView();
                break;
            case RoomEventCenter.RoomKitUIEvent.SHOW_QRCODE_VIEW:
                if (params == null) {
                    break;
                }
                String url = (String) params.get(RoomEventConstant.KEY_ROOM_URL);
                if (!TextUtils.isEmpty(url)) {
                    mRoomMainView.showQRCodeView(url);
                }
                break;
            case RoomEventCenter.RoomKitUIEvent.SHOW_APPLY_LIST:
                mRoomMainView.showApplyList();
                break;
            case RoomEventCenter.RoomKitUIEvent.START_SCREEN_SHARE:
                onScreenShareClick();
                break;
            case RoomEventCenter.RoomKitUIEvent.EXIT_MEETING:
                RoomEngineManager.sharedInstance(mContext).exitRoom();
                break;
            default:
                break;
        }
    }

    private void onScreenShareClick() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!PermissionUtils.isGrantedDrawOverlays()) {
                ToastUtils.showLong(mContext.getResources()
                        .getString(R.string.tuiroomkit_toast_need_floating_window_permission));
                PermissionUtils.requestDrawOverlays(new PermissionUtils.SimpleCallback() {
                    @Override
                    public void onGranted() {
                        mRoomMainView.startScreenShare();
                    }

                    @Override
                    public void onDenied() {
                        ToastUtils.showLong(mContext.getResources()
                                .getString(R.string.tuiroomkit_toast_need_floating_window_permission));
                    }
                });
            } else {
                mRoomMainView.startScreenShare();
            }
        } else {
            mRoomMainView.startScreenShare();
        }
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
            case REQUEST_RECEIVED:
                onRequestReceived(params);
                break;
            case ROOM_INFO_CHANGED:
                onRoomInfoChanged(params);
                break;
            case USER_SCREEN_CAPTURE_STOPPED:
                onUserScreenCaptureStopped();
                break;
            case USER_ROLE_CHANGED:
                onUserRoleChange(params);
                break;
            default:
                break;
        }
    }

    private void onUserVideoStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }

        TUIRoomDefine.VideoStreamType videoStreamType = (TUIRoomDefine.VideoStreamType)
                params.get(RoomEventConstant.KEY_STREAM_TYPE);

        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(videoStreamType)) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        boolean available = (boolean) params.get(RoomEventConstant.KEY_HAS_VIDEO);
        TUIRoomDefine.ChangeReason changeReason = (TUIRoomDefine.ChangeReason) params.get(RoomEventConstant.KEY_REASON);
        if (mRoomStore.userModel.userId.equals(userId)
                && !TUIRoomDefine.ChangeReason.BY_SELF.equals(changeReason)) {
            onCameraMuted(!available);
        }
    }

    private void onUserAudioStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        TUIRoomDefine.ChangeReason changeReason = (TUIRoomDefine.ChangeReason) params.get(RoomEventConstant.KEY_REASON);
        if (changeReason == null) {
            return;
        }
        boolean available = (boolean) params.get(RoomEventConstant.KEY_HAS_AUDIO);
        if (mRoomStore.userModel.userId.equals(userId)
                && !TUIRoomDefine.ChangeReason.BY_SELF.equals(changeReason)) {
            onMicrophoneMuted(!available);
        }
    }

    private void onRequestReceived(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        TUIRoomDefine.Request request = (TUIRoomDefine.Request) params.get(RoomEventConstant.KEY_REQUEST);
        if (request == null) {
            return;
        }
        switch (request.requestAction) {
            case REQUEST_TO_OPEN_REMOTE_MICROPHONE:
            case REQUEST_REMOTE_USER_ON_SEAT:
            case REQUEST_TO_OPEN_REMOTE_CAMERA:
                mRoomMainView.showInvitationDialog(request.requestId, request.requestAction);
                break;
            default:
                Log.i(TAG, "onRequestReceived ignore, request type :" + request.requestAction);
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
            mRoomStore.roomInfo.owner = roomInfo.owner;
            boolean isOwner = mRoomStore.userModel.userId.equals(roomInfo.owner);
            mRoomStore.userModel.role = isOwner ? TUIRoomDefine.Role.ROOM_OWNER : TUIRoomDefine.Role.GENERAL_USER;
            if (isOwner) {
                mRoomMainView.showSingleConfirmDialog(mContext.getString(R.string.tuiroomkit_have_become_master));
            }
        }

        boolean isVideoEnableChange = (boolean) params.get(RoomEventConstant.KEY_ENABLE_VIDEO);
        if (isVideoEnableChange) {
            mRoomStore.roomInfo.enableVideo = roomInfo.enableVideo;
            if (!isOwner() && !roomInfo.enableVideo) {
                mRoomEngine.stopPushLocalVideo();
                mRoomEngine.closeLocalCamera();
            }
        }
        boolean isAudioEnableChange = (boolean) params.get(RoomEventConstant.KEY_ENABLE_AUDIO);
        if (isAudioEnableChange) {
            mRoomStore.roomInfo.enableAudio = roomInfo.enableAudio;
            if (!isOwner() && !roomInfo.enableAudio) {
                mRoomEngine.stopPushLocalAudio();
                mRoomEngine.closeLocalMicrophone();
            }
        }
        mRoomStore.roomInfo.enableMessage = roomInfo.enableMessage;
    }

    private void onUserScreenCaptureStopped() {
        ForegroundService.stop(mContext);
        if (mRoomStore.roomInfo.enableVideo && mRoomStore.roomInfo.isOpenCamera) {
            mRoomEngine.openLocalCamera(mRoomStore.videoModel.isFrontCamera, null);
        }
    }

    private void onUserRoleChange(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        if (mRoomStore.userModel.isOnSeat) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        if (TextUtils.isEmpty(userId) || !mRoomStore.userModel.userId.equals(userId)) {
            return;
        }
        TUIRoomDefine.Role role = (TUIRoomDefine.Role) params.get(RoomEventConstant.KEY_ROLE);
        if (role == null) {
            return;
        }
        if (TUIRoomDefine.Role.ROOM_OWNER.equals(role)) {
            mRoomEngine.takeSeat(SEAT_INDEX, REQ_TIME_OUT, null);
        }

    }
}
