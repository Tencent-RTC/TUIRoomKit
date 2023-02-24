package com.tencent.cloud.tuikit.videoseat.core;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.videoseat.ui.TUIVideoSeatView;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.interfaces.ITUIExtension;
import com.tencent.qcloud.tuicore.interfaces.ITUIService;

import java.util.HashMap;
import java.util.Map;

public class TUIVideoSeatExtension implements ITUIExtension, ITUIService {

    public static final String OBJECT_TUI_VIDEO_SEAT = TUIVideoSeatExtension.class.getName();
    public static final String KEY_VIDEO_SEAT_VIEW   = "TUIVideoSeat";

    private TUIVideoSeatView mVideoSeatView;

    @Override
    public Map<String, Object> onGetExtensionInfo(String key, Map<String, Object> param) {
        if (OBJECT_TUI_VIDEO_SEAT.equals(key)) {
            //这个HashMap需携带返回给TUICore的View数据
            HashMap<String, Object> hashMap = new HashMap<>();
            Context context = (Context) param.get("context");
            final String roomId = (String) param.get("roomId");
            final TUIRoomEngine roomEngine = (TUIRoomEngine) param.get("roomEngine");
            mVideoSeatView = new TUIVideoSeatView(context, roomId, roomEngine);
            hashMap.put(KEY_VIDEO_SEAT_VIEW, mVideoSeatView);
            return hashMap;
        }
        return null;
    }

    @Override
    public Object onCall(String method, Map<String, Object> param) {
        if (TextUtils.equals(TUIConstants.TUIVideoSeat.METHOD_SWITCH_VIDEO_LAYOUT, method) && mVideoSeatView != null) {
            mVideoSeatView.switchVideoLayout();
        }
        return null;
    }
}
