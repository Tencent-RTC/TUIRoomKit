package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.Manifest;
import android.content.Context;
import android.content.Intent;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.model.utils.CommonUtils;
import com.tencent.cloud.tuikit.roomkit.view.component.PrepareView;
import com.tencent.cloud.tuikit.roomkit.view.activity.CreateRoomActivity;
import com.tencent.cloud.tuikit.roomkit.view.activity.EnterRoomActivity;
import com.tencent.qcloud.tuicore.permission.PermissionCallback;
import com.tencent.qcloud.tuicore.permission.PermissionRequester;
import com.tencent.trtc.TRTCCloudDef;


public class PrepareViewModel {
    private boolean       mIsFrontCamera;
    private Context       mContext;
    private PrepareView   mPrepareView;
    private RoomStore     mRoomStore;
    private RoomInfo      mRoomInfo;
    private TUIRoomEngine mRoomEngine;

    public PrepareViewModel(Context context, PrepareView prepareView) {
        mIsFrontCamera = true;
        mContext = context;
        mPrepareView = prepareView;
        initRoomStore();
    }

    public UserModel getUserModel() {
        return mRoomStore.userModel;
    }

    public void finishActivity() {
        RoomEventCenter.getInstance().notifyUIEvent(RoomEventCenter.RoomKitUIEvent.EXIT_PREPARE_ACTIVITY, null);
    }

    public void changeLanguage() {
        //TODO changeLanguage
    }

    public void setVideoView(TUIVideoView view) {
        mRoomEngine.setLocalVideoView(TUIRoomDefine.VideoStreamType.CAMERA_STREAM, view);
    }

    public void initMicAndCamera() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateMicPhoneButton(true);
                mRoomEngine.openLocalMicrophone(null);
                openLocalCamera();
                mRoomInfo.isOpenMicrophone = true;
            }

            @Override
            public void onDenied() {
                mPrepareView.updateMicPhoneButton(false);
                mRoomInfo.isOpenMicrophone = false;

                mPrepareView.updateVideoView(false);
                mRoomInfo.isOpenCamera = false;
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

    public void initRoomStore() {
        RoomEngineManager engineManager = RoomEngineManager.sharedInstance(mContext);
        mRoomEngine = engineManager.getRoomEngine();
        mRoomStore = engineManager.getRoomStore();
        mRoomInfo = mRoomStore.roomInfo;
    }

    public void switchMirrorType() {
        mRoomStore.videoModel.isMirror = !mRoomStore.videoModel.isMirror;
        TRTCCloudDef.TRTCRenderParams param = new TRTCCloudDef.TRTCRenderParams();
        param.mirrorType = mRoomStore.videoModel.isMirror ? TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_ENABLE
                : TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_DISABLE;
        mRoomEngine.getTRTCCloud().setLocalRenderParams(param);
    }

    public void switchCamera() {
        mIsFrontCamera = !mIsFrontCamera;
        mRoomEngine.getDeviceManager().switchCamera(mIsFrontCamera);
    }

    public void changeCameraState() {
        mRoomInfo.isOpenCamera = !mRoomInfo.isOpenCamera;
        if (mRoomInfo.isOpenCamera) {
            openLocalCamera();
        } else {
            closeLocalCamera();
        }
        mPrepareView.updateVideoView(mRoomInfo.isOpenCamera);
    }

    public void changeMicrophoneState() {
        mRoomInfo.isOpenMicrophone = !mRoomInfo.isOpenMicrophone;
        if (mRoomInfo.isOpenMicrophone) {
            openLocalMicrophone();
        } else {
            closeLocalMicrophone();
        }
        mPrepareView.updateMicPhoneButton(mRoomInfo.isOpenMicrophone);
    }

    public void closeLocalCamera() {
        mRoomEngine.closeLocalCamera();
    }

    public void closeLocalMicrophone() {
        mRoomEngine.closeLocalMicrophone();
    }

    public void createRoom(Context context) {
        Intent intent = new Intent(context, CreateRoomActivity.class);
        context.startActivity(intent);
    }

    public void enterRoom(Context context) {
        Intent intent = new Intent(context, EnterRoomActivity.class);
        context.startActivity(intent);
    }

    private void openLocalCamera() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateVideoView(true);
                mRoomEngine.openLocalCamera(mIsFrontCamera, null);
                mRoomInfo.isOpenCamera = true;
            }

            @Override
            public void onDenied() {
                mPrepareView.updateVideoView(false);
                mRoomInfo.isOpenCamera = false;
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

    private void openLocalMicrophone() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateMicPhoneButton(true);
                mRoomEngine.openLocalMicrophone(null);
            }

            @Override
            public void onDenied() {
                mPrepareView.updateMicPhoneButton(false);
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
}
