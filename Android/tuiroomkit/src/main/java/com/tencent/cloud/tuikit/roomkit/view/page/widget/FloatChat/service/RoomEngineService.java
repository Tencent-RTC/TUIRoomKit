package com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service;

import android.content.Context;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.model.TUIFloatChat;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.IFloatChatMessage.BarrageMessageDelegate;

public class RoomEngineService {

    private final TUIRoomEngine    mTUIRoomEngine = TUIRoomEngine.sharedInstance();
    private final Context          mContext;
    private BarrageMessageDelegate mDelegate;

    public RoomEngineService(Context context) {
        mContext = context;
    }

    public void setDelegate(BarrageMessageDelegate delegate) {
        mDelegate = delegate;
        if (delegate == null) {
            mTUIRoomEngine.removeObserver(mRoomObserver);
        } else {
            mTUIRoomEngine.addObserver(mRoomObserver);
        }
    }

    private final TUIRoomObserver mRoomObserver = new TUIRoomObserver() {
        @Override
        public void onRemoteUserEnterRoom(String roomId, TUIRoomDefine.UserInfo userInfo) {
            BarrageMessageDelegate delegate = mDelegate;
            if (delegate != null) {
                TUIFloatChat barrage = new TUIFloatChat();
                barrage.content = mContext.getString(R.string.tuiroomkit_float_chat_entered_room);
                barrage.user.userId = userInfo.userId;
                barrage.user.userName = userInfo.userName;
                barrage.user.avatarUrl = userInfo.avatarUrl;
                barrage.user.level = "0";
                delegate.onReceivedBarrage(barrage);
            }
        }
    };

}
