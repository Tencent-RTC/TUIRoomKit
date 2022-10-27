package com.tencent.qcloud.tuikit.tuibeauty.core;


import android.content.Context;
import android.text.TextUtils;

import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.interfaces.ITUIService;
import com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyView;

import java.util.Map;

public class TUIBeautyCallService implements ITUIService {

    private static TUIBeautyCallService sInstance;

    public static synchronized TUIBeautyCallService shareInstance() {
        if (sInstance == null) {
            sInstance = new TUIBeautyCallService();
        }
        return sInstance;
    }

    private TUIBeautyCallService() {

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
