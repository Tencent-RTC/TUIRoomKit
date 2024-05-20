package com.tencent.cloud.tuikit.roomkit.viewmodel;

import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomKitUIEvent.ENABLE_FLOAT_CHAT;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant.KEY_ENABLE_FLOAT_CHAT;

import android.text.TextUtils;

import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.FloatChatView;

import java.util.Map;

public class FloatChatViewModel implements RoomEventCenter.RoomKitUIEventResponder {
    private FloatChatView mFloatChatView;
    private RoomStore     mRoomState;

    public FloatChatViewModel(FloatChatView floatChatView) {
        mFloatChatView = floatChatView;
        mRoomState = RoomEngineManager.sharedInstance().getRoomStore();
        subscribeEvent();
    }

    public void destroy() {
        unSubscribeEvent();
    }

    public String getRoomId() {
        return mRoomState.roomInfo.roomId;
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeUIEvent(ENABLE_FLOAT_CHAT, this);
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeUIEvent(ENABLE_FLOAT_CHAT, this);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        if (!TextUtils.equals(key, ENABLE_FLOAT_CHAT) || params == null) {
            return;
        }
        boolean enableFloatChat = (Boolean) params.get(KEY_ENABLE_FLOAT_CHAT);
        mFloatChatView.enableFloatChat(enableFloatChat);
    }
}
