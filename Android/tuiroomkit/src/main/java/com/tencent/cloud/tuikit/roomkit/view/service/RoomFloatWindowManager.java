package com.tencent.cloud.tuikit.roomkit.view.service;

import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomEngineEvent.KICKED_OUT_OF_ROOM;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomEngineEvent.LOCAL_USER_DESTROY_ROOM;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomEngineEvent.LOCAL_USER_EXIT_ROOM;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomEngineEvent.ROOM_DISMISSED;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomKitUIEvent.ENTER_FLOAT_WINDOW;
import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomKitUIEvent.EXIT_FLOAT_WINDOW;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.utils.DrawOverlaysPermissionUtil;
import com.tencent.qcloud.tuicore.TUICore;

import java.util.Map;

public class RoomFloatWindowManager
        implements RoomEventCenter.RoomKitUIEventResponder, RoomEventCenter.RoomEngineEventResponder {
    private static final String TAG = "RoomFloatWindowManager";

    private static Context mAppContext;

    public RoomFloatWindowManager(Context context) {
        mAppContext = context.getApplicationContext();
        registerKitEvent();
    }

    public void destroy() {
        Log.d(TAG, "destroy");
        unRegisterKitEvent();
    }

    private void enterFloatWindow() {
        if (!DrawOverlaysPermissionUtil.isGrantedDrawOverlays()) {
            Log.d(TAG, "enter float window no float permission");
            return;
        }
        showFloatWindow();
    }

    private void exitFloatWindow() {
        dismissFloatWindow();
        showMainActivity();
    }

    private void registerKitEvent() {
        RoomEventCenter.getInstance().subscribeUIEvent(ENTER_FLOAT_WINDOW, this);
        RoomEventCenter.getInstance().subscribeUIEvent(EXIT_FLOAT_WINDOW, this);
        RoomEventCenter.getInstance().subscribeEngine(ROOM_DISMISSED, this);
        RoomEventCenter.getInstance().subscribeEngine(KICKED_OUT_OF_ROOM, this);
        RoomEventCenter.getInstance().subscribeEngine(LOCAL_USER_EXIT_ROOM, this);
        RoomEventCenter.getInstance().subscribeEngine(LOCAL_USER_DESTROY_ROOM, this);
    }

    private void unRegisterKitEvent() {
        RoomEventCenter.getInstance().unsubscribeUIEvent(ENTER_FLOAT_WINDOW, this);
        RoomEventCenter.getInstance().unsubscribeUIEvent(EXIT_FLOAT_WINDOW, this);
        RoomEventCenter.getInstance().unsubscribeEngine(ROOM_DISMISSED, this);
        RoomEventCenter.getInstance().unsubscribeEngine(KICKED_OUT_OF_ROOM, this);
        RoomEventCenter.getInstance().unsubscribeEngine(LOCAL_USER_EXIT_ROOM, this);
        RoomEventCenter.getInstance().unsubscribeEngine(LOCAL_USER_DESTROY_ROOM, this);
    }

    public void showMainActivity() {
        TUICore.startActivity("RoomMainActivity", null);
    }

    public void showFloatWindow() {
        Log.d(TAG, "show float window");
        Intent intent = new Intent(mAppContext, RoomFloatViewService.class);
        mAppContext.startService(intent);
    }

    public void dismissFloatWindow() {
        Log.d(TAG, "dismiss float window");
        Intent intent = new Intent(mAppContext, RoomFloatViewService.class);
        mAppContext.stopService(intent);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        Log.d(TAG, "onNotifyUIEvent key=" + key);
        switch (key) {
            case ENTER_FLOAT_WINDOW:
                enterFloatWindow();
                break;

            case EXIT_FLOAT_WINDOW:
                exitFloatWindow();
                break;

            default:
                Log.e(TAG, "un handle event : " + key);
                break;
        }
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        Log.d(TAG, "onEngineEvent event=" + event);
        switch (event) {
            case KICKED_OUT_OF_ROOM:
            case ROOM_DISMISSED:
                if (RoomEngineManager.sharedInstance(mAppContext).getRoomStore().isInFloatWindow()) {
                    dismissFloatWindow();
                    RoomEngineManager.sharedInstance(mAppContext).exitRoom();
                }
                break;

            case LOCAL_USER_EXIT_ROOM:
            case LOCAL_USER_DESTROY_ROOM:
                if (RoomEngineManager.sharedInstance(mAppContext).getRoomStore().isInFloatWindow()) {
                    dismissFloatWindow();
                }
                break;

            default:
                Log.w(TAG, "un handle event : " + event);
                break;
        }
    }
}
