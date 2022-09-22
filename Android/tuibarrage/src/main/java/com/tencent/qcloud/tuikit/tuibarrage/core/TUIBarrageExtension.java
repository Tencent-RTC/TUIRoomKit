package com.tencent.qcloud.tuikit.tuibarrage.core;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.tencent.qcloud.tuicore.interfaces.ITUIExtension;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;
import com.tencent.qcloud.tuikit.tuibarrage.view.ITUIBarrageListener;
import com.tencent.qcloud.tuikit.tuibarrage.view.TUIBarrageButton;
import com.tencent.qcloud.tuikit.tuibarrage.view.TUIBarrageDisplayView;

import java.util.HashMap;
import java.util.Map;

/**
 * 弹幕组件注册TUICore后,获取TUICore传入的用户组ID(房间ID),并绑定自己的布局文件;
 * 通过弹幕发送视图可以输入弹幕内容并点击发送,弹幕显示视图可以显示接收到的弹幕内容。
 */
public class TUIBarrageExtension implements ITUIExtension {
    private static final String TAG = "TUIBarrageExtension";

    public static final String OBJECT_TUI_BARRAGE = TUIBarrageExtension.class.getName();
    public static final String KEY_SEND_VIEW      = "TUIBarrageButton";
    public static final String KEY_DISPLAY_VIEW   = "TUIBarrageDisplayView";

    @Override
    public Map<String, Object> onGetExtensionInfo(String key, Map<String, Object> param) {
        //这个HashMap需携带返回给TUICore的View数据
        HashMap<String, Object> hashMap = new HashMap<>();

        if (OBJECT_TUI_BARRAGE.equals(key)) {
            Context context = (Context) param.get("context");
            final String groupId = (String) param.get("groupId");
            //弹幕发送View
            TUIBarrageButton button = new TUIBarrageButton(context, groupId);
            //弹幕显示View
            final TUIBarrageDisplayView displayView = new TUIBarrageDisplayView(context, groupId);
            button.getSendView().setBarrageListener(new ITUIBarrageListener() {
                @Override
                public void onSuccess(int code, String msg, TUIBarrageModel model) {
                    if (model == null || TextUtils.isEmpty(model.message)) {
                        Log.d(TAG, "message is null");
                        return;
                    }
                    displayView.receiveBarrage(model);
                }

                @Override
                public void onFailed(int code, String msg) {

                }
            });
            hashMap.put(KEY_SEND_VIEW, button);
            hashMap.put(KEY_DISPLAY_VIEW, displayView);
            return hashMap;
        }
        return null;
    }
}
