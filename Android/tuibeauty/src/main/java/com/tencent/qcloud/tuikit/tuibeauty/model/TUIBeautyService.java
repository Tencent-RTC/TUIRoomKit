package com.tencent.qcloud.tuikit.tuibeauty.model;

import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.copyRes;
import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.getResPath;
import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.setResPath;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.widget.Toast;

import com.tencent.liteav.basic.log.TXCLog;
import com.tencent.qcloud.tuicore.util.ToastUtil;
import com.tencent.qcloud.tuikit.tuibeauty.R;
import com.tencent.xmagic.XmagicApi;
import com.tencent.xmagic.XmagicProperty;
import com.tencent.xmagic.telicense.TELicenseCheck;

import java.io.File;


public class TUIBeautyService implements ITUIBeautyService {
    private static final String TAG = "TUIBeautyCallService";

    private static TUIBeautyService sInstance;

    private Context   mContext;
    private String    mLicenseUrl;
    private String    mLicenseKey;
    private XmagicApi mXmagicApi;

    public static synchronized TUIBeautyService getInstance() {
        if (sInstance == null) {
            sInstance = new TUIBeautyService();
        }
        return sInstance;
    }

    public void updateProperty(TUIBeautyItemInfo itemInfo) {
        if (mXmagicApi == null || itemInfo == null) {
            return;
        }
        if (itemInfo.getProperty() == null || itemInfo.getProperty().category == null) {
            return;
        }
        mXmagicApi.updateProperty(itemInfo.getProperty());
    }

    public XmagicProperty<XmagicProperty.XmagicPropertyValues> setCurrentDisPlayValue(
            XmagicProperty<XmagicProperty.XmagicPropertyValues> property, int value) {
        if (property == null || property.effValue == null) {
            return property;
        }
        property.effValue.setCurrentDisplayValue(value);
        return property;
    }

    @Override
    public void setLicense(Context context, String licenseUrl, String licenseKey) {
        if (TextUtils.isEmpty(licenseUrl) || TextUtils.isEmpty(licenseKey)) {
            return;
        }
        mLicenseUrl = licenseUrl;
        mLicenseKey = licenseKey;
        mContext = context;
        TELicenseCheck.getInstance().setTELicense(context, mLicenseUrl, mLicenseKey,
                new TELicenseCheck.TELicenseCheckListener() {
                    @Override
                    public void onLicenseCheckFinish(int i, String s) {
                        if (i == TELicenseCheck.ERROR_OK) {
                            initXmagicApi();
                        } else {
                            runOnMainThread(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(mContext,
                                            mContext.getString(R.string.tuibeauty_tips_xmagic_auth_failed),
                                            Toast.LENGTH_SHORT).show();
                                }
                            });
                        }
                    }
                });
    }

    public int processVideoFrame(int srcTextureId, int textureWidth, int textureHeight) {
        if (mXmagicApi == null) {
            return srcTextureId;
        }
        return mXmagicApi.process(srcTextureId, textureWidth, textureHeight);
    }

    private void initXmagicApi() {
        setResPath(new File(mContext.getFilesDir(), "xmagic/res").getAbsolutePath());
        copyRes(mContext.getApplicationContext());
        mXmagicApi = new XmagicApi(mContext, getResPath(), new XmagicApi.OnXmagicPropertyErrorListener() {
            @Override
            public void onXmagicPropertyError(final String s, final int i) {
                runOnMainThread(new Runnable() {
                    @Override
                    public void run() {
                        TXCLog.e(TAG, "onXmagicPropertyError,code:" + i + ",msg:" + s);
                        ToastUtil.toastLongMessage("init Xmagic error");
                    }
                });
            }
        });
        if (!mXmagicApi.isSupportBeauty()) {
            ToastUtil.toastLongMessage("Xmagic beauty not support");
        }
    }

    @Override
    public void destroy() {
        if (mXmagicApi != null) {
            mXmagicApi.onDestroy();
        }
        sInstance = null;
    }

    public void runOnMainThread(Runnable runnable) {
        Handler handler = new Handler(Looper.getMainLooper());
        if (handler.getLooper() == Looper.myLooper()) {
            runnable.run();
        } else {
            handler.post(runnable);
        }
    }
}
