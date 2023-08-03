package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.content.Context;
import android.content.Intent;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.utils.IntentUtils;
import com.tencent.cloud.tuikit.roomkit.utils.RoomPermissionUtil;
import com.tencent.cloud.tuikit.roomkit.view.activity.PrepareActivity;
import com.tencent.cloud.tuikit.roomkit.view.component.PrepareView;
import com.tencent.qcloud.tuicore.TUIThemeManager;
import com.tencent.qcloud.tuicore.permission.PermissionCallback;

import java.util.Locale;


public class PrepareViewModel {
    private Context       mContext;
    private PrepareView   mPrepareView;
    private RoomStore     mRoomStore;
    private RoomInfo      mRoomInfo;
    private TUIRoomEngine mRoomEngine;

    public PrepareViewModel(Context context, PrepareView prepareView) {
        mContext = context;
        mPrepareView = prepareView;
        initRoomStore();
    }

    public UserModel getUserModel() {
        return mRoomStore.userModel;

    }

    public void changeLanguage() {
        boolean isEnglish = Locale.ENGLISH.equals(TUIThemeManager.getInstance().getLocale(mContext));
        String language = isEnglish ? Locale.CHINESE.getLanguage() : Locale.ENGLISH.getLanguage();
        TUIThemeManager.getInstance().changeLanguage(mContext, language);
        Intent intent = new Intent(mContext, PrepareActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        IntentUtils.safeStartActivity(mContext, intent);
    }

    public void setVideoView(TUIVideoView view) {
        mRoomEngine.setLocalVideoView(TUIRoomDefine.VideoStreamType.CAMERA_STREAM, view);
    }

    public boolean isMicOpen() {
        return mRoomInfo.isOpenMicrophone;
    }
    public boolean isCameraOpen() {
        return mRoomInfo.isOpenCamera;
    }
    public void restoreMicAndCamera() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateMicPhoneButton(true);
                mRoomEngine.openLocalMicrophone(TUIRoomDefine.AudioQuality.DEFAULT, null);
                mRoomInfo.isOpenMicrophone = true;
                openLocalCamera();
            }

            @Override
            public void onDenied() {
                mPrepareView.updateMicPhoneButton(false);
                mRoomInfo.isOpenMicrophone = false;

                openLocalCamera();
            }
        };

        if (mRoomInfo.isOpenMicrophone) {
        RoomPermissionUtil.requestAudioPermission(mContext, callback);
        } else if (mRoomInfo.isOpenCamera) {
            openLocalCamera();
        }
    }

    public void initRoomStore() {
        RoomEngineManager engineManager = RoomEngineManager.sharedInstance(mContext);
        mRoomEngine = engineManager.getRoomEngine();
        mRoomStore = engineManager.getRoomStore();
        mRoomInfo = mRoomStore.roomInfo;
    }

    public void switchMirrorType() {
        RoomEngineManager.sharedInstance().enableVideoLocalMirror(!mRoomStore.videoModel.isLocalMirror);
    }

    public void switchCamera() {
        mRoomStore.videoModel.isFrontCamera = !mRoomStore.videoModel.isFrontCamera;
        mRoomEngine.getDeviceManager().switchCamera(mRoomStore.videoModel.isFrontCamera);
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

    private void openLocalCamera() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateVideoView(true);
                mRoomEngine.openLocalCamera(mRoomStore.videoModel.isFrontCamera, TUIRoomDefine.VideoQuality.Q_1080P,
                        null);
                mRoomInfo.isOpenCamera = true;
            }

            @Override
            public void onDenied() {
                mPrepareView.updateVideoView(false);
                mRoomInfo.isOpenCamera = false;
            }
        };

        if (mRoomInfo.isOpenCamera) {
            RoomPermissionUtil.requestCameraPermission(mContext, callback);
        }
    }

    private void openLocalMicrophone() {
        PermissionCallback callback = new PermissionCallback() {
            @Override
            public void onGranted() {
                mPrepareView.updateMicPhoneButton(true);
                mRoomEngine.openLocalMicrophone(TUIRoomDefine.AudioQuality.DEFAULT, null);
            }

            @Override
            public void onDenied() {
                mPrepareView.updateMicPhoneButton(false);
            }
        };

        if (mRoomInfo.isOpenMicrophone) {
            RoomPermissionUtil.requestAudioPermission(mContext, callback);
        }
    }
}
