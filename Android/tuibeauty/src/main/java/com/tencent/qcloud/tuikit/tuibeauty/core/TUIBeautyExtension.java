package com.tencent.qcloud.tuikit.tuibeauty.core;

import android.content.Context;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuicore.interfaces.ITUIExtension;
import com.tencent.qcloud.tuicore.interfaces.ITUIService;
import com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyButton;

import java.util.HashMap;
import java.util.Map;

/**
 * 美颜组件注册TUICore后,获取TUICore传入的TXBeautyManager,并绑定自己的布局文件;
 * 通过点击不同的美颜布局,可以体验不同的美颜功能。
 */
public class TUIBeautyExtension implements ITUIExtension, ITUIService {

    public static final String OBJECT_TUI_BEAUTY = TUIBeautyButton.class.getName();
    public static final String KEY_GET_VIEW      = "TUIBeauty";

    @Override
    public Map<String, Object> onGetExtensionInfo(String key, Map<String, Object> param) {
        //这个HashMap需携带返回给TUICore的View数据
        HashMap<String, Object> hashMap = new HashMap<>();

        if (OBJECT_TUI_BEAUTY.equals(key)) {
            Context context = (Context) param.get("context");
            TXBeautyManager beautyManager = (TXBeautyManager) param.get("beautyManager");
            TUIBeautyButton beautyExtension = new TUIBeautyButton(context,beautyManager);
            hashMap.put(KEY_GET_VIEW, beautyExtension);
            return hashMap;
        }
        return null;
    }

    @Override
    public Object onCall(String method, Map<String, Object> param) {
        return null;
    }
}
