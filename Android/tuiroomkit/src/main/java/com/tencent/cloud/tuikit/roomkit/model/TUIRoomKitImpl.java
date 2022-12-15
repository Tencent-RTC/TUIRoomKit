package com.tencent.cloud.tuikit.roomkit.model;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.liteav.basic.UserModel;
import com.tencent.liteav.basic.UserModelManager;
import com.tencent.cloud.tuikit.roomkit.MeetingActivity;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKitListener;

import java.util.ArrayList;
import java.util.List;

public class TUIRoomKitImpl extends TUIRoomKit implements RoomEngineManager.Listener {
    private static final String TAG = "TUIRoomKitImpl";

    private static TUIRoomKit sInstance;

    private Context                  mContext;
    private List<TUIRoomKitListener> mListenerList;

    public static TUIRoomKit sharedInstance(Context context) {
        if (sInstance == null) {
            synchronized (TUIRoomKitImpl.class) {
                if (sInstance == null) {
                    sInstance = new TUIRoomKitImpl(context);
                }
            }
        }
        return sInstance;
    }

    private TUIRoomKitImpl(Context context) {
        mContext = context.getApplicationContext();
        mListenerList = new ArrayList<>();
        RoomEngineManager.sharedInstance(mContext).setListener(this);
    }

    @Override
    public void setup(int sdkAppId, String userId, String userSig) {
        RoomEngineManager.sharedInstance(mContext).setup(sdkAppId, userId, userSig);
    }

    @Override
    public void createRoom(final RoomInfo roomInfo, RoomScene scene) {
        if (roomInfo == null || TextUtils.isEmpty(roomInfo.roomId)) {
            for (TUIRoomKitListener listener : mListenerList) {
                listener.onRoomEnter(-1, "roomInfo is empty");
            }
            return;
        }
        RoomEngineManager.sharedInstance(mContext).createRoom(roomInfo, scene);
    }

    @Override
    public void enterRoom(RoomInfo roomInfo, RoomScene scene) {
        if (roomInfo == null || TextUtils.isEmpty(roomInfo.roomId)) {
            for (TUIRoomKitListener listener : mListenerList) {
                listener.onRoomEnter(-1, "roomInfo or room id is empty");
            }
            return;
        }
        RoomEngineManager.sharedInstance(mContext).enterRoom(roomInfo, scene);
    }

    @Override
    public void addListener(TUIRoomKitListener listener) {
        if (listener != null) {
            mListenerList.add(listener);
        }
    }

    @Override
    public void onEnterEngineRoom(int code, String message, RoomInfo roomInfo) {
        Log.i(TAG, "onEnterEngineRoom: code" + code + " message" + message);
        if (roomInfo == null) {
            Log.e(TAG, "onEnterEngineRoom: " + "room info is null");
            return;
        }
        if (TextUtils.isEmpty(roomInfo.roomId)) {
            Log.e(TAG, "onEnterEngineRoom: " + "room id is null ");
            return;
        }
        if (mContext != null && code == 0) {
            MeetingActivity.enterRoom(mContext, roomInfo.roomId,
                    roomInfo.isOpenCamera, roomInfo.isOpenMicrophone);
            UserModelManager.getInstance().getUserModel().userType = UserModel.UserType.ROOM;
        }
        for (TUIRoomKitListener listener : mListenerList) {
            listener.onRoomEnter(code, message);
        }
    }

    @Override
    public void onExitEngineRoom() {
        for (TUIRoomKitListener listener : mListenerList) {
            listener.onExitRoom();
        }
    }
}
