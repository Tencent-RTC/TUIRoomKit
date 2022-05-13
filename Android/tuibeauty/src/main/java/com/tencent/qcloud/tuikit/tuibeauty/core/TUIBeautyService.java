package com.tencent.qcloud.tuikit.tuibeauty.core;


import android.content.Context;
import android.text.TextUtils;


import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.interfaces.ITUIService;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyManager;

import java.util.Map;

public class TUIBeautyService implements ITUIService {

    private static TUIBeautyService sInstance;

    public static synchronized TUIBeautyService shareInstance() {
        if (sInstance == null) {
            sInstance = new TUIBeautyService();
        }
        return sInstance;
    }

    private TUIBeautyService() {

    }

    @Override
    public Object onCall(String method, Map<String, Object> param) {
        if (param != null && TextUtils.equals(TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, method)) {
            int srcTextureId = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_SRC_TEXTURE_ID);
            int width = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_WIDTH);
            int height = (int) param.get(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_HEIGHT);
            return TUIBeautyManager.getInstance().processVideoFrame(srcTextureId, width, height);
        } else if (param != null && TextUtils.equals(TUIConstants.TUIBeauty.METHOD_INIT_XMAGIC, method)) {
            Context context = (Context) param.get(TUIConstants.TUIBeauty.PARAM_NAME_CONTEXT);
            String licenseKey = (String) param.get(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_KEY);
            String licenseUrl = (String) param.get(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_URL);
            TUIBeautyManager.getInstance().init(context, licenseUrl, licenseKey);
        }
        return null;
    }
}
