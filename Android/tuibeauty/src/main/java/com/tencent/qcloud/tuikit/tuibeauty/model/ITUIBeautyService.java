package com.tencent.qcloud.tuikit.tuibeauty.model;

import android.content.Context;

public interface ITUIBeautyService {
    void setLicense(Context context, String licenseUrl, String licenseKey);

    int processVideoFrame(int srcTextureId, int textureWidth, int textureHeight);

    void destroy();
}
