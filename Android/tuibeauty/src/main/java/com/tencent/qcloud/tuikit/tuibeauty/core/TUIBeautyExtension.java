package com.tencent.qcloud.tuikit.tuibeauty.core;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.interfaces.ITUIExtension;
import com.tencent.qcloud.tuicore.interfaces.ITUIService;
import com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyButton;
import com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyView;

import java.util.HashMap;
import java.util.Map;

/**
 * 美颜组件注册TUICore后,获取TUICore传入的TXBeautyManager,并绑定自己的布局文件;
 * 通过点击不同的美颜布局,可以体验不同的美颜功能。
 */
public class TUIBeautyExtension implements ITUIExtension, ITUIService {

    public static final String OBJECT_TUI_BEAUTY_BUTTON = TUIBeautyButton.class.getName();
    public static final String KEY_GET_VIEW             = "TUIBeauty";

    @Override
    public Map<String, Object> onGetExtensionInfo(String key, Map<String, Object> param) {
        //这个HashMap需携带返回给TUICore的View数据
        HashMap<String, Object> hashMap = new HashMap<>();

        if (param != null && OBJECT_TUI_BEAUTY_BUTTON.equals(key)) {
            Context context = (Context) param.get("context");
            TXBeautyManager beautyManager = (TXBeautyManager) param.get("beautyManager");
            TUIBeautyButton beautyExtension;
            if (param.get("icon") == null) {
                beautyExtension = new TUIBeautyButton(context, beautyManager);
            } else {
                beautyExtension = new TUIBeautyButton(context, beautyManager, (Integer) param.get("icon"));
            }
            hashMap.put(KEY_GET_VIEW, beautyExtension);
            return hashMap;
        }
        return null;
    }

    @Override
    public Object onCall(String method, Map<String, Object> param) {
        if (param != null && TextUtils.equals(TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, method)) {
            int srcTextureId = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_SRC_TEXTURE_ID);
            int width = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_WIDTH);
            int height = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_HEIGHT);
            return TUIBeautyView.getBeautyService().processVideoFrame(srcTextureId, width, height);
        } else if (param != null && TextUtils.equals(TUIConstants.TUIBeauty.METHOD_INIT_XMAGIC, method)) {
            Context context = (Context) param.get(TUIConstants.TUIBeauty.PARAM_NAME_CONTEXT);
            String licenseKey = (String) param.get(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_KEY);
            String licenseUrl = (String) param.get(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_URL);
            TUIBeautyView.getBeautyService().setLicense(context, licenseUrl, licenseKey);
        } else if (TextUtils.equals(TUIConstants.TUIBeauty.METHOD_DESTROY_XMAGIC, method)) {
            TUIBeautyView.getBeautyService().destroy();
        }
        return null;
    }
}
