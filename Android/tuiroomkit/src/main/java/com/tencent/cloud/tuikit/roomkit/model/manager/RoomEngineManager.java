package com.tencent.cloud.tuikit.roomkit.model.manager;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.model.TUIRoomKitImpl;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.liteav.basic.UserModel;
import com.tencent.liteav.basic.UserModelManager;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.liteav.debug.GenerateTestUserSig;

import java.util.HashMap;
import java.util.Map;

public class RoomEngineManager extends TUIRoomObserver {
    private static final String TAG = "RoomEngineManager";

    private static final int SEAT_INDEX   = -1;
    private static final int REQ_TIME_OUT = 15;

    private static RoomEngineManager sInstance;

    private String                     mSelfUserId;
    private Context                    mContext;
    private Listener                   mListener;
    private Map<String, RoomInfo>      mRoomInfoMap;
    private Map<String, TUIRoomEngine> mRoomEngineMap;

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
        mContext = context.getApplicationContext();
        mRoomEngineMap = new HashMap<>();
        mRoomInfoMap = new HashMap<>();
    }

    public void setListener(Listener listener) {
        mListener = listener;
    }

    public void setup(final int sdkAppId, String userId, String userSig) {
        Log.i(TAG, "setup sdkAppId: " + sdkAppId + " userSig is empty: "
                + TextUtils.isEmpty(userSig + " userId: " + userId));
        mSelfUserId = userId;
        TUIRoomEngine.login(mContext, sdkAppId, userId, userSig, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "setup success");
                final UserModel userModel = UserModelManager.getInstance().getUserModel();
                V2TIMManager.getInstance().initSDK(mContext, sdkAppId, null);
                TUIRoomEngine.setSelfInfo(userModel.userName, userModel.userAvatar, null);
            }

            @Override
            public void onError(TUICommonDefine.Error code, String message) {
                Log.e(TAG, "setup onError code : " + code + " message:" + message);
            }
        });
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
        mRoomInfoMap.put(roomInfo.roomId, roomInfo);
        TUIRoomEngine roomEngine = getRoomEngine(roomInfo.roomId);
        roomEngine.addObserver(this);
        TUIRoomDefine.RoomInfo engineRoomInfo = new TUIRoomDefine.RoomInfo();
        engineRoomInfo.name = roomInfo.name;
        engineRoomInfo.roomId = roomInfo.roomId;
        engineRoomInfo.owner = roomInfo.owner;
        engineRoomInfo.enableVideo = true;
        engineRoomInfo.enableAudio = true;
        engineRoomInfo.enableMessage = true;
        engineRoomInfo.enableSeatControl = false;
        engineRoomInfo.roomType = TUIRoomDefine.RoomType.GROUP;
        engineRoomInfo.maxSeatCount = 8;
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

    public void enterRoom(final RoomInfo roomInfo, TUIRoomKit.RoomScene scene) {
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
        TUIRoomEngine roomEngine = getRoomEngine(roomInfo.roomId);
        if (roomEngine == null) {
            roomEngine = TUIRoomEngine.createInstance();
            mRoomEngineMap.put(roomId, roomEngine);
        }
        roomEngine.addObserver(this);
        final TUIRoomEngine finalRoomEngine = roomEngine;
        roomEngine.enterRoom(roomId, new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo engineRoomInfo) {
                Log.i(TAG, "enterRoom success");
                roomInfo.owner = engineRoomInfo.owner;
                roomInfo.name = engineRoomInfo.name;
                roomInfo.owner = engineRoomInfo.owner;
                roomInfo.roomId = engineRoomInfo.roomId;
                roomInfo.enableVideo = engineRoomInfo.enableVideo;
                roomInfo.enableAudio = engineRoomInfo.enableAudio;
                roomInfo.enableMessage = engineRoomInfo.enableMessage;
                mRoomInfoMap.put(roomId, roomInfo);
                finalRoomEngine.takeSeat(SEAT_INDEX, REQ_TIME_OUT, new TUIRoomDefine.RequestCallback() {
                    @Override
                    public void onAccepted(int requestId, String userId) {
                        mListener.onEnterEngineRoom(0, "success", roomInfo);
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
                mListener.onEnterEngineRoom(-1, message, null);
            }
        });
    }

    public void exitRoom(String roomId) {
        RoomInfo roomInfo = getRoomInfo(roomId);
        if (roomInfo == null) {
            return;
        }
        if (mSelfUserId == null) {
            return;
        }
        TUIRoomEngine roomEngine = getRoomEngine(roomId);
        roomEngine.stopPushLocalVideo();
        roomEngine.stopPushLocalAudio();
        roomEngine.closeLocalCamera();
        roomEngine.closeLocalMicrophone();
        if (mSelfUserId.equals(roomInfo.owner)) {
            roomEngine.destroyRoom(null);
        } else {
            roomEngine.exitRoom(false, null);
        }
        roomEngine.removeObserver(this);
        if (mListener != null) {
            mListener.onExitEngineRoom();
        }
    }

    public boolean isRoomOwner(String roomId) {
        RoomInfo roomInfo = getRoomInfo(roomId);
        if (roomInfo == null) {
            return false;
        }
        if (mSelfUserId == null) {
            return false;
        }
        return mSelfUserId.equals(roomInfo.owner);
    }

    public TUIRoomEngine getRoomEngine(String roomId) {
        TUIRoomEngine roomEngine = mRoomEngineMap.get(roomId);
        if (roomEngine == null) {
            roomEngine = TUIRoomEngine.createInstance();
            mRoomEngineMap.put(roomId, roomEngine);
        }
        return roomEngine;
    }

    public RoomInfo getRoomInfo(String roomId) {
        return mRoomInfoMap.get(roomId);
    }

    @Override
    public void onRoomInfoChanged(String roomId, TUIRoomDefine.RoomInfo engineRoomInfo) {
        if (engineRoomInfo == null) {
            return;
        }
        if (TextUtils.isEmpty(engineRoomInfo.roomId)) {
            return;
        }

        RoomInfo roomInfo;
        if (mRoomInfoMap.containsKey(engineRoomInfo.roomId)) {
            roomInfo = mRoomInfoMap.get(engineRoomInfo.roomId);
        } else {
            roomInfo = new RoomInfo();
        }
        roomInfo.name = engineRoomInfo.name;
        roomInfo.owner = engineRoomInfo.owner;
        roomInfo.roomId = engineRoomInfo.roomId;
        roomInfo.enableVideo = engineRoomInfo.enableVideo;
        roomInfo.enableAudio = engineRoomInfo.enableAudio;
        roomInfo.enableMessage = engineRoomInfo.enableMessage;
        mRoomInfoMap.put(roomInfo.roomId, roomInfo);
    }

    public interface Listener {
        void onEnterEngineRoom(int code, String message, RoomInfo roomInfo);

        void onExitEngineRoom();
    }

}
