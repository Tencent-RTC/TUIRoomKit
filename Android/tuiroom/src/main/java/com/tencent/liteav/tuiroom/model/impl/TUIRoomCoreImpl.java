package com.tencent.liteav.tuiroom.model.impl;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.liteav.tuiroom.model.TUIRoomCore;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreCallback;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreListener;
import com.tencent.liteav.tuiroom.model.impl.base.GroupNotificationData;
import com.tencent.liteav.tuiroom.model.impl.base.TRTCLogger;
import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfo;
import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfoCallback;
import com.tencent.liteav.tuiroom.model.impl.im.ImServiceListener;
import com.tencent.liteav.tuiroom.model.impl.im.IMService;
import com.tencent.liteav.tuiroom.model.impl.base.SignallingConstant;
import com.tencent.liteav.tuiroom.model.impl.trtc.TRTCService;
import com.tencent.liteav.tuiroom.model.impl.trtc.TXTRTCRoomListener;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.rtmp.ui.TXCloudVideoView;
import com.tencent.trtc.TRTCCloud;
import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCStatistics;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TUIRoomCoreImpl extends TUIRoomCore implements TXTRTCRoomListener, ImServiceListener {
    private static final String TAG = "TUIRoomCoreImpl";

    private static final int CODE_SUCCESS = 0;
    private static final int CODE_ERROR   = -1;

    private static TUIRoomCoreImpl     sInstance;
    private        TUIRoomCoreListener mTUIRoomCoreListener;
    private        Handler             mMainHandler;
    private        IMService           mIMService;
    private        TRTCService         mTRTCService;

    private Set<String>                          mAnchorList;
    private List<TUIRoomCoreDef.UserInfo>        mUserInfoList;
    private Map<String, TUIRoomCoreDef.UserInfo> mUserInfoMap;
    private String                               mSelfUserId;

    private TUIRoomCoreDef.SpeechMode mSpeechMode = TUIRoomCoreDef.SpeechMode.FREE_SPEECH;
    private boolean                   mIsUseFrontCamera;
    private boolean                   mIsChatRoomMuted;
    private boolean                   mIsSpeechApplicationForbidden;
    private boolean                   mIsMutedCameraByMaster;
    private boolean                   mIsMutedMicByMaster;

    private TUIRoomCoreImpl(Context context) {
        mIMService = new IMService(context);
        mTRTCService = new TRTCService(context);
        mIMService.setListener(this);
        mTRTCService.setListener(this);
        mMainHandler = new Handler(Looper.getMainLooper());
        mUserInfoMap = new HashMap<>();
        mAnchorList = new HashSet<>();
        mUserInfoList = new ArrayList<>();
    }

    public static TUIRoomCoreImpl getInstance(Context context) {
        if (sInstance == null) {
            synchronized (TUIRoomCoreImpl.class) {
                if (sInstance == null) {
                    sInstance = new TUIRoomCoreImpl(context);
                }
            }
        }
        return sInstance;
    }

    @Override
    public void destroyInstance() {
        if (sInstance != null) {
            destroy();
            sInstance = null;
        }
    }

    @Override
    public void setListener(TUIRoomCoreListener listener) {
        mTUIRoomCoreListener = listener;
    }

    @Override
    public void createRoom(final int roomId, final TUIRoomCoreDef.SpeechMode speechMode,
                           final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                final int sdkAppId = TUILogin.getSdkAppId();
                final String userId = TUILogin.getUserId();
                final String userSig = TUILogin.getUserSig();
                TRTCLogger.i(TAG, "createRoom room, app id:" + sdkAppId + " room id:" + roomId + " user id:"
                        + userId + " userSig is empty:" + TextUtils.isEmpty(userSig));
                if (!TUILogin.isUserLogined()) {
                    TRTCLogger.e(TAG, "failed, you must login first");
                    if (callback != null) {
                        callback.onCallback(CODE_ERROR, "failed, you must login first");
                    }
                    return;
                }
                if (roomId == 0) {
                    TRTCLogger.i(TAG, "enterRoom, roomId: " + roomId);
                    callback.onCallback(CODE_ERROR, "room id is empty");
                    return;
                }
                clear();
                mSelfUserId = userId;
                mIMService.createRoom(String.valueOf(roomId), speechMode, String.valueOf(roomId),
                        new TUIRoomCoreCallback.ActionCallback() {
                            @Override
                            public void onCallback(int code, String msg) {
                                TRTCLogger.i(TAG, "im create, code:" + code + " msg:" + msg);
                                if (code == CODE_SUCCESS) {
                                    initUserInfoList();
                                    initGroupNotification();
                                    mTRTCService.enterRoom(sdkAppId, roomId, userId, userSig,
                                            TRTCCloudDef.TRTCRoleAnchor, new TUIRoomCoreCallback.ActionCallback() {
                                                @Override
                                                public void onCallback(int code, String msg) {
                                                    TRTCLogger.i(TAG, "trtc enter, code:" + code
                                                            + " msg:" + msg);
                                                    if (callback != null) {
                                                        callback.onCallback(code, msg);
                                                    }
                                                }
                                            });
                                } else {
                                    if (callback != null) {
                                        callback.onCallback(code, msg);
                                    }
                                }
                            }
                        });
            }
        });
    }

    @Override
    public void destroyRoom(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "destroyRoom");
                if (!mIMService.isOwner()) {
                    TRTCLogger.e(TAG, "you are not the room owner");
                    callback.onCallback(CODE_ERROR, "you are not the room owner");
                    return;
                }
                mTRTCService.exitRoom(new TUIRoomCoreCallback.ActionCallback() {
                    @Override
                    public void onCallback(final int code, final String msg) {
                        runOnMainThread(new Runnable() {
                            @Override
                            public void run() {
                                if (code != CODE_SUCCESS) {
                                    if (mTUIRoomCoreListener != null) {
                                        mTUIRoomCoreListener.onError(code, msg);
                                    }
                                    if (callback != null) {
                                        callback.onCallback(code, msg);
                                    }
                                } else {
                                    mIMService.destroyRoom(new TUIRoomCoreCallback.ActionCallback() {
                                        @Override
                                        public void onCallback(final int code, final String msg) {
                                            clear();
                                            if (callback != null) {
                                                callback.onCallback(code, msg);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    @Override
    public void enterRoom(final int roomId, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "enterRoom, roomId: " + roomId);
                if (!TUILogin.isUserLogined()) {
                    TRTCLogger.e(TAG, "failed, you must login first");
                    if (callback != null) {
                        callback.onCallback(CODE_ERROR, "failed, you must login first");
                    }
                    return;
                }
                clear();
                final String userId = TUILogin.getUserId();
                mSelfUserId = userId;
                mIMService.enterRoom(String.valueOf(roomId), new TUIRoomCoreCallback.ActionCallback() {
                    @Override
                    public void onCallback(int code, String msg) {
                        if (code == CODE_SUCCESS) {
                            initUserInfoList();
                            initGroupNotification();
                            int role = mSpeechMode == TUIRoomCoreDef.SpeechMode.FREE_SPEECH
                                    ? TRTCCloudDef.TRTCRoleAnchor : TRTCCloudDef.TRTCRoleAudience;
                            mTRTCService.enterRoom(TUILogin.getSdkAppId(), roomId, userId, TUILogin.getUserSig(),
                                    role, new TUIRoomCoreCallback.ActionCallback() {
                                        @Override
                                        public void onCallback(int code, String msg) {
                                            if (callback != null) {
                                                callback.onCallback(code, msg);
                                            }
                                            if (mIsMutedCameraByMaster) {
                                                onAllCameraMuted(true);
                                            }
                                            if (mIsMutedMicByMaster) {
                                                onAllMicrophoneMuted(true);
                                            }
                                        }
                                    });
                        } else {
                            callback.onCallback(code, msg);
                        }
                    }
                });
            }
        });
    }

    @Override
    public void leaveRoom(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "leaveRoom");
                if (mIMService.isOwner()) {
                    TRTCLogger.e(TAG, "you are the room owner, you should call destroyRoom");
                    if (callback != null) {
                        callback.onCallback(CODE_ERROR, "you are the room owner, you should call destroyRoom");
                    }
                    return;
                }
                mTRTCService.exitRoom(new TUIRoomCoreCallback.ActionCallback() {
                    @Override
                    public void onCallback(int code, String msg) {
                        if (code == CODE_SUCCESS) {
                            mIMService.exitRoom(new TUIRoomCoreCallback.ActionCallback() {
                                @Override
                                public void onCallback(int code, String msg) {
                                    clear();
                                    if (callback != null) {
                                        callback.onCallback(code, msg);
                                    }
                                }
                            });
                        } else {
                            if (mTUIRoomCoreListener != null) {
                                mTUIRoomCoreListener.onError(code, msg);
                            }
                            if (callback != null) {
                                callback.onCallback(code, msg);
                            }
                        }
                    }
                });
            }
        });
    }

    @Override
    public TUIRoomCoreDef.RoomInfo getRoomInfo() {
        TRTCLogger.i(TAG, "getRoomInfo");
        return mIMService.getRoomInfo();
    }

    @Override
    public List<TUIRoomCoreDef.UserInfo> getRoomUsers() {
        TRTCLogger.i(TAG, "getRoomUsers");
        return mUserInfoList;
    }

    @Override
    public void getUserInfo(final String userId, final TUIRoomCoreCallback.UserInfoCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "getUserInfo userId: " + userId);
                TUIRoomCoreDef.UserInfo userInfo = mUserInfoMap.get(userId);
                if (userInfo != null) {
                    TRTCLogger.i(TAG, "getUserInfo : " + userInfo);
                    callback.onCallback(CODE_SUCCESS, "", userInfo);
                } else {
                    mIMService.getUserInfo(userId, new TXUserInfoCallback() {
                        @Override
                        public void onCallback(int code, String msg, final TXUserInfo userInfo) {
                            runOnMainThread(new Runnable() {
                                @Override
                                public void run() {
                                    TUIRoomCoreDef.UserInfo tuiUserInfo = new TUIRoomCoreDef.UserInfo();
                                    tuiUserInfo.userId = userInfo.userId;
                                    tuiUserInfo.userName = userInfo.userName;
                                    tuiUserInfo.userAvatar = userInfo.avatarURL;
                                    if (userInfo.isOwner) {
                                        tuiUserInfo.role = TUIRoomCoreDef.Role.MASTER;
                                    } else {
                                        tuiUserInfo.role = TUIRoomCoreDef.Role.AUDIENCE;
                                    }
                                    TRTCLogger.i(TAG, "getUserInfo : " + userInfo);
                                    mUserInfoList.add(tuiUserInfo);
                                    mUserInfoMap.put(userInfo.userId, tuiUserInfo);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    @Override
    public void setSelfProfile(final String userName, final String avatarURL,
                               final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setSelfProfile userName: " + userName + "avatarURL: " + avatarURL);
                mIMService.setSelfProfile(userName, avatarURL, callback);
            }
        });
    }

    @Override
    public void transferRoomMaster(final String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "transferRoomMaster userId: " + userId);
                mIMService.transferRoomMaster(callback);
            }
        });
    }

    @Override
    public void startCameraPreview(final boolean isFront, final TXCloudVideoView view) {
        TRTCLogger.i(TAG, "startCameraPreview isFront: " + isFront + " mIsMutedMicByMaster: "
                + mIsMutedCameraByMaster);
        mIsUseFrontCamera = isFront;
        mTRTCService.startCameraPreview(isFront, view, null);
    }

    @Override
    public void stopCameraPreview() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopCameraPreview");
                mTRTCService.stopCameraPreview();
            }
        });
    }

    @Override
    public void setVideoMirror(final int type) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setLocalViewMirror type: " + type);
                mTRTCService.setLocalViewMirror(type);
            }
        });
    }

    @Override
    public void startLocalAudio(final int quality) {
        TRTCLogger.i(TAG, "startLocalAudio quality: " + quality + " mIsMutedMicByMaster: "
                + mIsMutedMicByMaster);
        mTRTCService.setAudioQuality(quality);
        mTRTCService.startMicrophone();
    }

    @Override
    public void stopLocalAudio() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopLocalAudio");
                mTRTCService.stopMicrophone();
            }
        });
    }

    @Override
    public void setSpeaker(final boolean useSpeaker) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setSpeaker useSpeaker: " + useSpeaker);
                mTRTCService.setSpeaker(useSpeaker);
            }
        });
    }

    @Override
    public void startRemoteView(final String userId, final TXCloudVideoView view,
                                final TUIRoomCoreDef.SteamType steamType,
                                final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "startRemoteView userId: " + userId + " steamType:" + steamType);
                TUIRoomCoreDef.UserInfo userInfo = mUserInfoMap.get(userId);
                if (userInfo == null) {
                    return;
                }
                if (steamType == TUIRoomCoreDef.SteamType.SCREE) {
                    mTRTCService.startPlaySubStream(userId, view, callback);
                } else {
                    mTRTCService.startPlay(userId, view, callback);
                }

            }
        });
    }

    @Override
    public void stopRemoteView(final String userId, final TUIRoomCoreDef.SteamType steamType,
                               final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopRemoteView userId: " + userId + " steamType:" + steamType);
                if (steamType == TUIRoomCoreDef.SteamType.SCREE) {
                    mTRTCService.stopPlaySubStream(userId, callback);
                } else {
                    mTRTCService.stopPlay(userId, callback);
                }
            }
        });
    }

    @Override
    public void switchCamera(final boolean isFront) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "switchCamera isFront: " + isFront);
                if (isFront != mIsUseFrontCamera) {
                    mIsUseFrontCamera = isFront;
                    mTRTCService.switchCamera();
                }
            }
        });
    }

    @Override
    public void sendChatMessage(final String message, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendChatMessage " + " mIsChatRoomMuted: " + mIsChatRoomMuted);
                if (mIsChatRoomMuted) {
                    if (callback != null) {
                        callback.onCallback(CODE_ERROR, "the room is muted for chat");
                    }
                    return;
                }
                mIMService.sendRoomTextMsg(message, callback);
            }
        });
    }

    @Override
    public void sendCustomMessage(final String data, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendCustomMessage");
                mIMService.sendRoomCustomMsg(data, callback);
            }
        });
    }

    @Override
    public void muteUserMicrophone(final String userId, final boolean mute,
                                   final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "muteUserMicrophone userId: " + userId + " mute: " + mute);
                mIMService.muteUserMicrophone(userId, mute, callback);
            }
        });
    }

    @Override
    public void muteAllUsersMicrophone(final boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "muteAllUsersMicrophone mute: " + mute);
                mIMService.muteAllUsersMicrophone(mute, callback);
            }
        });
    }

    @Override
    public void muteUserCamera(final String userId, final boolean mute,
                               final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "muteUserCamera userId: " + userId + " mute: " + mute);
                mIMService.muteUserCamera(userId, mute, callback);
            }
        });
    }

    @Override
    public void muteAllUsersCamera(final boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "muteAllUsersCamera mute: " + mute);
                mIMService.muteAllUsersCamera(mute, callback);
            }
        });
    }

    @Override
    public void muteChatRoom(final boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "muteChatRoom mute: " + mute);
                mIMService.muteChatRoom(mute, callback);
            }
        });
    }

    @Override
    public void kickOffUser(final String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "kickOffUser userId: " + userId);
                mIMService.kickOffUser(userId, callback);
            }
        });
    }

    @Override
    public void startCallingRoll(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "startCallingRoll");
                mIMService.setCallingRoll(true, callback);
            }
        });
    }

    @Override
    public void stopCallingRoll(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopCallingRoll");
                mIMService.setCallingRoll(false, callback);
            }
        });
    }

    @Override
    public void replyCallingRoll(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "replyCallingRoll");
                mIMService.replyCallingRoll(callback);
            }
        });
    }

    @Override
    public void sendSpeechInvitation(final String userId, final TUIRoomCoreCallback.InvitationCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendSpeechInvitation userId: " + userId);
                mIMService.sendSpeechInvitation(userId, callback);
            }
        });
    }

    @Override
    public void cancelSpeechInvitation(final String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "cancelSpeechInvitation userId: " + userId);
                mIMService.cancelSpeechInvitation(userId, callback);
            }
        });
    }

    @Override
    public void replySpeechInvitation(final boolean agree, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "replySpeechInvitation agree: " + agree);
                mIMService.replySpeechInvitation(agree, callback);
            }
        });
    }

    @Override
    public void sendSpeechApplication(final TUIRoomCoreCallback.InvitationCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendSpeechApplication speech application forbidden"
                        + mIsSpeechApplicationForbidden);
                if (mIsSpeechApplicationForbidden) {
                    callback.onError(CODE_ERROR, "the room speech application forbidden");
                    return;
                }
                mIMService.sendSpeechApplication(callback);
            }
        });
    }

    @Override
    public void cancelSpeechApplication(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "cancelSpeechApplication");
                mIMService.cancelSpeechApplication(callback);
            }
        });
    }

    @Override
    public void replySpeechApplication(final boolean agree, final String userId,
                                       final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "replySpeechApplication agree: " + agree + " userId: " + userId);
                mIMService.replySpeechApplication(agree, userId, callback);
            }
        });
    }

    @Override
    public void forbidSpeechApplication(final boolean forbid, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "forbidSpeechApplication forbid: " + forbid);
                mIMService.forbidSpeechApplication(forbid, callback);
            }
        });
    }

    @Override
    public void sendOffSpeaker(final String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendOffSpeaker userId: " + userId);
                mIMService.sendOffSpeaker(userId, callback);
            }
        });
    }

    @Override
    public void sendOffAllSpeakers(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "sendOffAllSpeakers");
                mIMService.sendOffAllSpeakers(mAnchorList, callback);
            }
        });
    }

    @Override
    public void exitSpeechState(final TUIRoomCoreCallback.ActionCallback callback) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "exitSpeechState");
                mTRTCService.switchToAudience(new TRTCService.OnSwitchListener() {
                    @Override
                    public void onTRTCSwitchRole(int code, String message) {
                        if (code == 0) {
                            onTRTCAnchorExit(mSelfUserId);
                        }
                        callback.onCallback(code, message);
                    }
                });
            }
        });
    }

    @Override
    public void startScreenCapture(final TRTCCloudDef.TRTCVideoEncParam param,
                                   final TRTCCloudDef.TRTCScreenShareParams screenShareParams) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "startScreenCapture");
                mTRTCService.startScreenCapture(param, screenShareParams);
            }
        });
    }

    @Override
    public void stopScreenCapture() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopScreenCapture");
                mTRTCService.stopScreenCapture();
            }
        });

    }

    @Override
    public TXBeautyManager getBeautyManager() {
        TRTCLogger.i(TAG, "getBeautyManager");
        return mTRTCService.getTXBeautyManager();
    }

    @Override
    public void setVideoQosPreference(final TRTCCloudDef.TRTCNetworkQosParam qosParam) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                mTRTCService.setNetworkQosParam(qosParam);
            }
        });
    }

    @Override
    public void setAudioQuality(final int quality) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setAudioQuality quality : " + quality);
                mTRTCService.setAudioQuality(quality);
            }
        });
    }

    @Override
    public void setVideoResolution(final int resolution) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setVideoResolution resolution : " + resolution);
                mTRTCService.setVideoResolution(resolution);
            }
        });
    }

    @Override
    public void setVideoFps(final int fps) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setAudioQuality fps : " + fps);
                mTRTCService.setVideoFps(fps);
            }
        });
    }

    @Override
    public void setVideoBitrate(final int bitrate) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setVideoBitrate fps : " + bitrate);
                mTRTCService.setVideoBitrate(bitrate);
            }
        });
    }

    @Override
    public void enableAudioEvaluation(final boolean enable) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "enableAudioEvaluation enable : " + enable);
                mTRTCService.enableAudioEvaluation(enable);
            }
        });
    }

    @Override
    public void setAudioPlayVolume(final int volume) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setAudioPlayVolume volume : " + volume);
                mTRTCService.setAudioPlayoutVolume(volume);
            }
        });
    }

    @Override
    public void setAudioCaptureVolume(final int volume) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "setAudioCaptureVolume volume : " + volume);
                mTRTCService.setAudioCaptureVolume(volume);
            }
        });
    }

    @Override
    public void startFileDumping(final TRTCCloudDef.TRTCAudioRecordingParams params) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "startFileDumping");
                mTRTCService.startFileDumping(params);
            }
        });
    }

    @Override
    public void stopFileDumping() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "stopFileDumping");
                mTRTCService.stopFileDumping();
            }
        });
    }

    @Override
    public void onRoomDestroy(final String roomId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onRoomDestroy : " + roomId);
                mTRTCService.exitRoom(new TUIRoomCoreCallback.ActionCallback() {
                    @Override
                    public void onCallback(int code, String msg) {
                        if (mTUIRoomCoreListener != null) {
                            mTUIRoomCoreListener.onDestroyRoom();
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onRoomReceiveRoomTextMsg(final String roomId, final String message, final TXUserInfo userInfo) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onRoomReceiveRoomTextMsg roomId : " + roomId + " userInfo: " + userInfo);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onReceiveChatMessage(userInfo.userId, message);
                }
            }
        });
    }

    @Override
    public void onRoomReceiveRoomCustomMsg(final String roomId, final String data, final TXUserInfo userInfo) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onRoomReceiveRoomCustomMsg roomId : " + roomId + " userInfo: " + userInfo);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onReceiveRoomCustomMsg(userInfo.userId, data);
                }
            }
        });
    }

    @Override
    public void onTRTCAnchorEnter(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onTRTCAnchorEnter userId : " + userId);
                mAnchorList.add(userId);
                final TUIRoomCoreDef.UserInfo tuiUserInfo = mUserInfoMap.get(userId);
                if (tuiUserInfo != null) {
                    if (tuiUserInfo.role != TUIRoomCoreDef.Role.MASTER) {
                        tuiUserInfo.role = TUIRoomCoreDef.Role.ANCHOR;
                    }
                } else {
                    mIMService.getUserInfo(userId, new TXUserInfoCallback() {
                        @Override
                        public void onCallback(int code, String msg, final TXUserInfo userInfo) {
                            runOnMainThread(new Runnable() {
                                @Override
                                public void run() {
                                    TUIRoomCoreDef.UserInfo tuiUserInfo = new TUIRoomCoreDef.UserInfo();
                                    tuiUserInfo.userId = userInfo.userId;
                                    tuiUserInfo.userName = userInfo.userName;
                                    tuiUserInfo.userAvatar = userInfo.avatarURL;
                                    if (userInfo.isOwner) {
                                        tuiUserInfo.role = TUIRoomCoreDef.Role.MASTER;
                                    } else {
                                        tuiUserInfo.role = TUIRoomCoreDef.Role.ANCHOR;
                                    }
                                    mUserInfoList.add(tuiUserInfo);
                                    mUserInfoMap.put(userInfo.userId, tuiUserInfo);
                                }
                            });
                        }
                    });
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onRemoteUserEnterSpeechState(userId);
                }
            }
        });
    }

    @Override
    public void onTRTCAnchorExit(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onTRTCAnchorExit userId : " + userId);
                runOnMainThread(new Runnable() {
                    @Override
                    public void run() {
                        TUIRoomCoreDef.UserInfo tuiUserInfo = mUserInfoMap.get(userId);
                        if (tuiUserInfo != null) {
                            if (tuiUserInfo.role != TUIRoomCoreDef.Role.MASTER) {
                                tuiUserInfo.role = TUIRoomCoreDef.Role.AUDIENCE;
                            }
                        }
                        if (mTUIRoomCoreListener != null) {
                            mTUIRoomCoreListener.onRemoteUserExitSpeechState(userId);
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onTRTCVideoAvailable(final String userId, final boolean available) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onTRTCVideoAvailable userId : " + userId + " available: " + available);
                final TUIRoomCoreDef.UserInfo userInfo = mUserInfoMap.get(userId);
                if (userInfo == null) {
                    TRTCLogger.i(TAG, "userInfo is null");
                    return;
                }
                userInfo.isVideoAvailable = available;
                runOnMainThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mTUIRoomCoreListener != null) {
                            mTUIRoomCoreListener.onRemoteUserCameraAvailable(userId, available);
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onTRTCAudioAvailable(final String userId, final boolean available) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onTRTCAudioAvailable userId : " + userId + " available: " + available);
                final TUIRoomCoreDef.UserInfo userInfo = mUserInfoMap.get(userId);
                if (userInfo == null) {
                    TRTCLogger.i(TAG, "userInfo is null");
                    return;
                }
                userInfo.isAudioAvailable = available;
                runOnMainThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mTUIRoomCoreListener != null) {
                            mTUIRoomCoreListener.onRemoteUserAudioAvailable(userId, available);
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onError(final int errorCode, final String errorMsg) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onError errorCode : " + errorCode + " errorMsg: " + errorMsg);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onError(errorCode, errorMsg);
                }
            }
        });
    }

    @Override
    public void onNetworkQuality(final TRTCCloudDef.TRTCQuality localQuality,
                                 final ArrayList<TRTCCloudDef.TRTCQuality> arrayList) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onNetworkQuality(localQuality, arrayList);
                }
            }
        });
    }

    @Override
    public void onStatistics(final TRTCStatistics statistics) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onStatistics(statistics);
                }
            }
        });
    }

    @Override
    public void onUserVoiceVolume(final ArrayList<TRTCCloudDef.TRTCVolumeInfo> userVolumes, final int totalVolume) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                if (mTUIRoomCoreListener != null && userVolumes != null) {
                    for (TRTCCloudDef.TRTCVolumeInfo volumeInfo : userVolumes) {
                        mTUIRoomCoreListener.onUserVoiceVolume(volumeInfo.userId, volumeInfo.volume);
                    }
                }
            }
        });
    }

    @Override
    public void onTRTCSubStreamAvailable(final String userId, final boolean available) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                final TUIRoomCoreDef.UserInfo tuiUserInfo = mUserInfoMap.get(userId);
                if (tuiUserInfo == null) {
                    mIMService.getUserInfo(userId, new TXUserInfoCallback() {
                        @Override
                        public void onCallback(int code, String msg, final TXUserInfo userInfo) {
                            runOnMainThread(new Runnable() {
                                @Override
                                public void run() {
                                    TUIRoomCoreDef.UserInfo tuiUserInfo = new TUIRoomCoreDef.UserInfo();
                                    tuiUserInfo.userId = userInfo.userId;
                                    tuiUserInfo.userName = userInfo.userName;
                                    tuiUserInfo.userAvatar = userInfo.avatarURL;
                                    tuiUserInfo.role = TUIRoomCoreDef.Role.MASTER;
                                    mUserInfoList.add(tuiUserInfo);
                                    mUserInfoMap.put(userInfo.userId, tuiUserInfo);
                                    tuiUserInfo.isSharingScreen = available;
                                    if (mTUIRoomCoreListener != null) {
                                        mTUIRoomCoreListener.onRemoteUserScreenVideoAvailable(userId, available);
                                    }
                                }
                            });
                        }
                    });
                } else {
                    tuiUserInfo.isSharingScreen = available;
                    if (mTUIRoomCoreListener != null) {
                        mTUIRoomCoreListener.onRemoteUserScreenVideoAvailable(userId, available);
                    }
                }
            }
        });
    }

    @Override
    public void onScreenCaptureStarted() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onScreenCaptureStarted");
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onScreenCaptureStarted();
                }
            }
        });
    }

    @Override
    public void onScreenCaptureStopped(final int reason) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onScreenCaptureStopped");
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onScreenCaptureStopped(reason);
                }
            }
        });
    }

    @Override
    public void onMemberEnter(final TXUserInfo userInfo) {
        TRTCLogger.i(TAG, "onMemberEnter, userInfo:" + userInfo);
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                if (userInfo != null) {
                    TUIRoomCoreDef.UserInfo tuiUserInfo = mUserInfoMap.get(userInfo.userId);
                    if (tuiUserInfo == null) {
                        tuiUserInfo = new TUIRoomCoreDef.UserInfo();
                        tuiUserInfo.userId = userInfo.userId;
                        tuiUserInfo.userName = userInfo.userName;
                        tuiUserInfo.userAvatar = userInfo.avatarURL;
                        tuiUserInfo.role = userInfo.isOwner ? TUIRoomCoreDef.Role.MASTER :
                                TUIRoomCoreDef.Role.AUDIENCE;
                        if (userInfo.isOwner) {
                            tuiUserInfo.role = TUIRoomCoreDef.Role.MASTER;
                        } else {
                            tuiUserInfo.role = TUIRoomCoreDef.Role.AUDIENCE;
                        }
                        mUserInfoList.add(tuiUserInfo);
                        mUserInfoMap.put(userInfo.userId, tuiUserInfo);
                    }
                    if (mTUIRoomCoreListener != null) {
                        mTUIRoomCoreListener.onRemoteUserEnter(userInfo.userId);
                    }
                }
            }
        });
    }

    @Override
    public void onMemberLeave(final TXUserInfo userInfo) {
        TRTCLogger.i(TAG, "onMemberLeave, userInfo:" + userInfo);
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                if (userInfo != null) {
                    mUserInfoMap.remove(userInfo.userId);
                    if (mTUIRoomCoreListener != null) {
                        mTUIRoomCoreListener.onRemoteUserLeave(userInfo.userId);
                        removeMemberList(userInfo.userId);
                    }
                }
            }
        });
    }

    @Override
    public void onMicrophoneMuted(final boolean muted) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onMicrophoneMuted muted: " + muted);
                mIsMutedMicByMaster = muted;
                if (muted) {
                    mTRTCService.stopMicrophone();
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onMicrophoneMuted(muted);
                }
            }
        });
    }

    @Override
    public void onAllMicrophoneMuted(final boolean muted) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onAllMicrophoneMuted muted: " + muted);
                if (mIMService.isOwner()) {
                    return;
                }
                mIsMutedMicByMaster = muted;
                if (muted) {
                    mTRTCService.stopMicrophone();
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onMicrophoneMuted(muted);
                }
            }
        });
    }

    @Override
    public void onCameraMuted(final boolean muted) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onCameraMuted muted: " + muted);
                mIsMutedCameraByMaster = muted;
                if (muted) {
                    mTRTCService.stopCameraPreview();
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onCameraMuted(muted);
                }
            }
        });
    }

    @Override
    public void onAllCameraMuted(final boolean muted) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onAllCameraMuted muted: " + muted);
                if (mIMService.isOwner()) {
                    return;
                }
                mIsMutedCameraByMaster = muted;
                if (muted) {
                    mTRTCService.stopCameraPreview();
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onCameraMuted(muted);
                }
            }
        });
    }

    @Override
    public void onChatRoomMuted(final boolean muted) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onChatRoomMuted muted: " + muted);
                mIsChatRoomMuted = muted;
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onChatRoomMuted(muted);
                }
            }
        });
    }

    @Override
    public void onCallingRoll(final String userId, final boolean isStart) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onCallingRoll isStart: " + isStart + " userId: " + userId);
                if (mTUIRoomCoreListener != null) {
                    if (isStart) {
                        mTUIRoomCoreListener.onCallingRollStarted(userId);
                    } else {
                        mTUIRoomCoreListener.onCallingRollStopped(userId);
                    }
                }
            }
        });
    }

    @Override
    public void onMemberReplyCallingRoll(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onMemberReplyCallingRoll userId: " + userId);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onMemberReplyCallingRoll(userId);
                }
            }
        });
    }

    @Override
    public void onRoomMasterChanged(final String previousUserId, final String currentUserId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                final TUIRoomCoreDef.UserInfo currentUserInfo = mUserInfoMap.get(currentUserId);
                if (currentUserInfo != null) {
                    currentUserInfo.role = TUIRoomCoreDef.Role.MASTER;
                }
                final TUIRoomCoreDef.UserInfo previousUserInfo = mUserInfoMap.get(previousUserId);
                if (previousUserInfo != null) {
                    previousUserInfo.role = TUIRoomCoreDef.Role.ANCHOR;
                }
                TRTCLogger.i(TAG, "onRoomMasterChanged currentUserInfo: " + currentUserInfo
                        + " previousUserInfo: " + previousUserInfo);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onRoomMasterChanged(previousUserId, currentUserId);
                }
            }
        });
    }

    @Override
    public void onReceiveInvitationCancelled(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onReceiveInvitationCancelled: " + userId);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onReceiveInvitationCancelled(userId);
                }
            }
        });
    }

    @Override
    public void onSpeechApplicationCancelled(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onSpeechApplicationCancelled: " + userId);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onSpeechApplicationCancelled(userId);
                }
            }
        });
    }

    @Override
    public void onOrderedToExitSpeechState(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onOrderedToExitSpeechState: " + userId);
                exitSpeechState(new TUIRoomCoreCallback.ActionCallback() {
                    @Override
                    public void onCallback(int code, String msg) {
                        if (mTUIRoomCoreListener != null) {
                            mTUIRoomCoreListener.onOrderedToExitSpeechState(userId);
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onSpeechApplicationForbidden(final boolean isForbidden) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onSpeechApplicationForbidden isForbidden: " + isForbidden);
                mIsSpeechApplicationForbidden = isForbidden;
                if (mIMService.isOwner()) {
                    return;
                }
                if (isForbidden) {
                    exitSpeechState(new TUIRoomCoreCallback.ActionCallback() {
                        @Override
                        public void onCallback(int code, String msg) {
                            TRTCLogger.i(TAG, "onSpeechApplicationForbidden, exitSpeechState, code:"
                                    + code + " msg:" + msg);
                        }
                    });
                }
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onSpeechApplicationForbidden(isForbidden);
                }
            }
        });
    }

    @Override
    public void onReceiveKickedOff(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onReceiveKickedOff, userId:" + userId);
                if (mIMService.isOwner()) {
                    destroyRoom(new TUIRoomCoreCallback.ActionCallback() {
                        @Override
                        public void onCallback(int code, String msg) {
                            TRTCLogger.e(TAG, "destroyRoom, code:" + code + " msg:" + msg);
                            if (mTUIRoomCoreListener != null) {
                                mTUIRoomCoreListener.onReceiveKickedOff(userId);
                            }
                        }
                    });
                } else {
                    leaveRoom(new TUIRoomCoreCallback.ActionCallback() {
                        @Override
                        public void onCallback(int code, String msg) {
                            TRTCLogger.e(TAG, "leaveRoom, code:" + code + " msg:" + msg);
                            if (mTUIRoomCoreListener != null) {
                                mTUIRoomCoreListener.onReceiveKickedOff(userId);
                            }
                        }
                    });
                }
            }
        });
    }

    @Override
    public void onReceiveSpeechApplication(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onReceiveSpeechApplication userId : " + userId);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onReceiveSpeechApplication(userId);
                }
            }
        });
    }

    @Override
    public void onReceiveSpeechInvitation(final String userId) {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                TRTCLogger.i(TAG, "onReceiveSpeechInvitation userId : " + userId);
                if (mTUIRoomCoreListener != null) {
                    mTUIRoomCoreListener.onReceiveSpeechInvitation(userId);
                }
            }
        });
    }

    @Override
    public int getSdkVersion() {
        return SignallingConstant.VALUE_VERSION;
    }

    private void destroy() {
        clear();
        TRTCCloud.destroySharedInstance();
        mIsUseFrontCamera = false;
    }

    private void clear() {
        mAnchorList.clear();
        mUserInfoList.clear();
        mUserInfoMap.clear();
        mIsUseFrontCamera = false;
        mIsChatRoomMuted = false;
        mIsSpeechApplicationForbidden = false;
        mIsMutedCameraByMaster = false;
        mIsMutedMicByMaster = false;
        mSelfUserId = "";
    }

    private void runOnMainThread(Runnable runnable) {
        Handler handler = mMainHandler;
        if (handler != null) {
            if (handler.getLooper() == Looper.myLooper()) {
                runnable.run();
            } else {
                handler.post(runnable);
            }
        } else {
            runnable.run();
        }
    }

    private void initGroupNotification() {
        GroupNotificationData groupNotificationData = mIMService.getGroupNotificationData();
        if (groupNotificationData == null) {
            return;
        }
        TRTCLogger.i(TAG, "initGroupNotification group notification: " + groupNotificationData);
        mSpeechMode = SignallingConstant.VALUE_APPLY_SPEECH.equals(groupNotificationData.getSpeechMode())
                ? TUIRoomCoreDef.SpeechMode.APPLY_SPEECH : TUIRoomCoreDef.SpeechMode.FREE_SPEECH;
        mIsChatRoomMuted = groupNotificationData.isChatRoomMuted();
        mIsMutedCameraByMaster = groupNotificationData.isAllCameraMuted();
        mIsMutedMicByMaster = groupNotificationData.isAllMicMuted();
        mIsSpeechApplicationForbidden = groupNotificationData.isSpeechApplicationForbidden();
    }

    private void initUserInfoList() {
        runOnMainThread(new Runnable() {
            @Override
            public void run() {
                List<TXUserInfo> txmUserInfoList = mIMService.getUserInfoList();
                if (txmUserInfoList == null) {
                    TRTCLogger.i(TAG, "init serInfoList txmUserInfoList is null: ");
                    return;
                }
                for (TXUserInfo userInfo : txmUserInfoList) {
                    if (mUserInfoMap.get(userInfo.userId) == null) {
                        TUIRoomCoreDef.UserInfo tuiUserInfo = new TUIRoomCoreDef.UserInfo();
                        tuiUserInfo.userId = userInfo.userId;
                        tuiUserInfo.userName = userInfo.userName;
                        tuiUserInfo.userAvatar = userInfo.avatarURL;
                        tuiUserInfo.role = userInfo.isOwner ? TUIRoomCoreDef.Role.MASTER :
                                TUIRoomCoreDef.Role.AUDIENCE;
                        mUserInfoList.add(tuiUserInfo);
                        mUserInfoMap.put(userInfo.userId, tuiUserInfo);
                    }
                }
                TRTCLogger.i(TAG, "initUserInfoList user list : " + mUserInfoList.toString());
            }
        });
    }

    private void removeMemberList(String userId) {
        for (Iterator<TUIRoomCoreDef.UserInfo> it = mUserInfoList.iterator(); it.hasNext(); ) {
            TUIRoomCoreDef.UserInfo userInfo = it.next();
            if (TextUtils.isEmpty(userId)) {
                continue;
            }
            if (userId.equals(userInfo.userId)) {
                it.remove();
            }
        }
    }
}
