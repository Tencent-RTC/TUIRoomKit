package com.tencent.cloud.tuikit.roomkit.model.manager;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.TUIRoomKitImpl;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.imsdk.v2.V2TIMManager;

public class RoomEngineManager {
    private static final String TAG = "RoomEngineManager";

    private static final int SEAT_INDEX   = -1;
    private static final int REQ_TIME_OUT = 15;

    private static RoomEngineManager sInstance;

    private Context         mContext;
    private Listener        mListener;
    private TUIRoomEngine   mRoomEngine;
    private RoomStore       mRoomStore;
    private TUIRoomObserver mObserver;

    public static RoomEngineManager sharedInstance(Context context) {
        if (sInstance == null) {
            synchronized (TUIRoomKitImpl.class) {
                if (sInstance == null) {
                    sInstance = new RoomEngineManager(context);
                }
            }
        }
        return sInstance;
    }

    private RoomEngineManager(Context context) {
        mRoomEngine = TUIRoomEngine.createInstance();
        mObserver = RoomEventCenter.getInstance().getEngineEventCent();
        mRoomEngine.addObserver(mObserver);
        mContext = context.getApplicationContext();
        mRoomStore = new RoomStore();
        //TODO 等待Engine RoomInfoChange回调修改后删除
        RoomEventCenter.getInstance().setRoomStore(mRoomStore);
    }

    private void refreshRoomEngine() {
        mRoomEngine.removeObserver(mObserver);
        mRoomEngine = TUIRoomEngine.createInstance();
        mObserver = RoomEventCenter.getInstance().getEngineEventCent();
        mRoomEngine.addObserver(mObserver);
    }

    public void setListener(Listener listener) {
        mListener = listener;
    }

    public void login(final int sdkAppId, final String userId, String userSig) {
        Log.i(TAG, "setup sdkAppId: " + sdkAppId + " userSig is empty: "
                + TextUtils.isEmpty(userSig + " userId: " + userId));
        TUIRoomEngine.login(mContext, sdkAppId, userId, userSig, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "setup success");
                mRoomStore.userModel.userId = userId;
                if (mListener != null) {
                    mListener.onLogin(0, "success");
                }
                V2TIMManager.getInstance().initSDK(mContext, sdkAppId, null);
            }

            @Override
            public void onError(TUICommonDefine.Error code, String message) {
                Log.e(TAG, "login onError code : " + code + " message:" + message);
                if (mListener != null) {
                    mListener.onLogin(-1, message);
                }
            }
        });
    }

    public void setSelfInfo(String userName, String avatarURL) {
        Log.i(TAG, "setSelfInfo userName: " + userName + ",avatarURL: " + avatarURL);
        mRoomStore.userModel.userName = TextUtils.isEmpty(userName) ? "" : userName;
        mRoomStore.userModel.userAvatar = TextUtils.isEmpty(userName) ? "" : avatarURL;
        TUIRoomEngine.setSelfInfo(mRoomStore.userModel.userName, mRoomStore.userModel.userAvatar, null);
    }

    public void createRoom(final RoomInfo roomInfo, final TUIRoomKit.RoomScene scene) {
        if (mContext == null) {
            return;
        }
        if (roomInfo == null) {
            return;
        }
        if (TextUtils.isEmpty(roomInfo.roomId)) {
            return;
        }
        TUIRoomDefine.RoomInfo engineRoomInfo = new TUIRoomDefine.RoomInfo();
        engineRoomInfo.name = roomInfo.name;
        engineRoomInfo.roomId = roomInfo.roomId;
        engineRoomInfo.owner = roomInfo.owner;
        engineRoomInfo.enableVideo = true;
        engineRoomInfo.enableAudio = true;
        engineRoomInfo.enableMessage = true;
        engineRoomInfo.enableSeatControl = roomInfo.enableSeatControl;
        if (TUIRoomKit.RoomScene.MEETING.equals(scene)) {
            engineRoomInfo.roomType = TUIRoomDefine.RoomType.GROUP;
        } else {
            engineRoomInfo.roomType = TUIRoomDefine.RoomType.OPEN;
        }
        engineRoomInfo.maxSeatCount = 8;
        TUIRoomEngine roomEngine = getRoomEngine();
        roomEngine.createRoom(engineRoomInfo, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "createRoom success");
                enterRoom(roomInfo, scene);
            }

            @Override
            public void onError(TUICommonDefine.Error code, String message) {
                ToastUtils.showShort("code: " + code + " message:" + message);
                Log.e(TAG, "createRoom onError code : " + code + " message:" + message);
            }
        });
    }

    public void enterRoom(final RoomInfo roomInfo, final TUIRoomKit.RoomScene scene) {
        if (mContext == null) {
            return;
        }
        if (roomInfo == null) {
            return;
        }
        final String roomId = roomInfo.roomId;
        if (TextUtils.isEmpty(roomId)) {
            return;
        }

        TUIRoomEngine roomEngine = getRoomEngine();
        if (roomEngine == null) {
            roomEngine = TUIRoomEngine.createInstance();
        }
        final TUIRoomEngine finalRoomEngine = roomEngine;
        roomEngine.enterRoom(roomId, new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo engineRoomInfo) {

                Log.i(TAG, "enterRoom success");
                roomInfo.name = engineRoomInfo.name;
                roomInfo.owner = engineRoomInfo.owner;
                roomInfo.roomId = engineRoomInfo.roomId;
                roomInfo.enableVideo = engineRoomInfo.enableVideo;
                roomInfo.enableAudio = engineRoomInfo.enableAudio;
                roomInfo.enableMessage = engineRoomInfo.enableMessage;
                roomInfo.enableSeatControl = engineRoomInfo.enableSeatControl;
                mRoomStore.roomInfo = roomInfo;
                mRoomStore.roomScene = scene;
                TUIRoomDefine.Role role = TUIRoomDefine.Role.GENERAL_USER;
                if (engineRoomInfo.owner.equals(mRoomStore.userModel.userId)) {
                    role = TUIRoomDefine.Role.ROOM_OWNER;
                }
                mRoomStore.userModel.role = role;
                if (roomInfo.enableSeatControl
                        && !TUIRoomDefine.Role.ROOM_OWNER.equals(role)) {
                    if (mListener != null) {
                        mListener.onEnterEngineRoom(0, "success", roomInfo);
                    }
                    return;
                }
                finalRoomEngine.takeSeat(SEAT_INDEX, REQ_TIME_OUT, new TUIRoomDefine.RequestCallback() {
                    @Override
                    public void onAccepted(int requestId, String userId) {
                        mRoomStore.userModel.isOnSeat = true;
                        if (mListener != null) {
                            mListener.onEnterEngineRoom(0, "success", roomInfo);
                        }
                    }

                    @Override
                    public void onRejected(int requestId, String userId, String message) {
                        Log.e(TAG, "takeSeat onRejected userId : " + userId + " message:" + message);
                    }

                    @Override
                    public void onCancelled(int requestId, String userId) {
                        Log.e(TAG, "takeSeat onRejected requestId : " + requestId + ",userId:" + userId);
                    }

                    @Override
                    public void onTimeout(int requestId, String userId) {
                        Log.e(TAG, "takeSeat onTimeout userId : " + userId);
                    }

                    @Override
                    public void onError(int requestId, String userId, TUICommonDefine.Error code, String message) {
                        Log.e(TAG, "takeSeat onError userId:" + userId + ",code : " + code + ",message:" + message);
                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error code, String message) {
                Log.e(TAG, "enterRoom onError code : " + code + " message:" + message);
                ToastUtils.showShort("code: " + code + " message:" + message);
                if (mListener != null) {
                    mListener.onEnterEngineRoom(-1, message, null);
                }
            }
        });
    }

    public void exitRoom() {
        if (mRoomStore.roomInfo == null) {
            return;
        }
        if (mRoomStore.userModel.userId == null) {
            return;
        }
        TUIRoomEngine roomEngine = getRoomEngine();
        roomEngine.stopPushLocalVideo();
        roomEngine.stopPushLocalAudio();
        roomEngine.closeLocalCamera();
        roomEngine.closeLocalMicrophone();
        if (TUIRoomDefine.Role.ROOM_OWNER.equals(mRoomStore.userModel.role)) {
            roomEngine.destroyRoom(null);
        } else {
            roomEngine.exitRoom(false, null);
        }
        if (mListener != null) {
            mListener.onExitEngineRoom();
        }
        refreshRoomStore();
        refreshRoomEngine();
    }

    private void refreshRoomStore() {
        mRoomStore = new RoomStore();
        mRoomStore.initialCurrentUser();
        RoomEventCenter.getInstance().setRoomStore(mRoomStore);
    }

    public TUIRoomEngine getRoomEngine() {
        return mRoomEngine;
    }

    public RoomStore getRoomStore() {
        return mRoomStore;
    }

    public interface Listener {
        void onLogin(int code, String message);

        void onEnterEngineRoom(int code, String message, RoomInfo roomInfo);

        void onExitEngineRoom();
    }
}
