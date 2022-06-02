package com.tencent.qcloud.tuikit.tuibeauty.model;

import android.app.Activity;
import android.content.Context;
import android.text.TextUtils;
import android.util.Log;


import com.tencent.liteav.basic.log.TXCLog;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import com.tencent.qcloud.tuikit.tuibeauty.model.download.TUIBeautyDownloadListener;
import com.tencent.qcloud.tuikit.tuibeauty.model.download.TUIBeautyMaterialDownloader;
import com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautySPUtils;
import com.tencent.qcloud.tuikit.tuibeauty.view.internal.TUIBeautyProgressDialog;
import com.tencent.xmagic.XmagicApi;
import com.tencent.xmagic.XmagicProperty;
import com.tencent.xmagic.auth.Auth;
import com.tencent.xmagic.auth.Json;
import com.tencent.xmagic.license.LicenceCheck;


import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.copyRes;
import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.getResPath;
import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.setResPath;


public class TUIBeautyService implements ITUIBeautyService {
    private static final String TAG = "TUIBeautyCallService";

    public static final String DOWNLOAD_URL_LIBS_V8A = "https://liteav.sdk.qcloud.com/app/res/xmagic/libs/arm64-v8a.zip";
    public static final String DOWNLOAD_URL_LIBS_V7A = "https://liteav.sdk.qcloud.com/app/res/xmagic/libs/armeabi-v7a.zip";

    private static final String KEY_IS_LIBS_LOAD = "is_libs_load";

    private static TUIBeautyService sInstance;

    private XmagicApi mXmagicApi;
    private Context   mContext;
    private String    mLicenseUrl;
    private String    mLicenseKey;
    private boolean   authorized = false;

    private TUIBeautyProgressDialog mProgressDialog;

    public static synchronized TUIBeautyService getInstance() {
        if (sInstance == null) {
            sInstance = new TUIBeautyService();
        }
        return sInstance;
    }

    private synchronized void checkAuth(Context context) {
        Log.d(TAG, "checkAuth: authorized=" + authorized);
        if (authorized) {
            initXmagicApi();
            return;
        }
        LicenceCheck mLicenceCheck = LicenceCheck.getInstance();
        String licenseInfo = mLicenceCheck.getBase64Licence();
        if (TextUtils.isEmpty(licenseInfo)) {
            licenseInfo = mLicenceCheck.getLicensePathBase64();
        }
        if (TextUtils.isEmpty(licenseInfo)) {
            Log.d(TAG, "licenseInfo is empty");
            authorized = false;
        } else {
            Auth.AuthResult result = Auth.authByBase64(context, licenseInfo, "");

            String msg = Json.toJsonStr(result);
            Log.d(TAG, "isSucceed=" + result.isSucceed);
            Log.d(TAG, "msg=" + msg);
            authorized = result.isSucceed;
        }
        if (!authorized) {
            Log.i(TAG, "auth Xmagic failed");
        } else {
            initXmagicApi();
        }
    }

    public void updateProperty(TUIBeautyItemInfo itemInfo) {
        if (mXmagicApi == null) {
            return;
        }
        mXmagicApi.updateProperty(itemInfo.getProperty());
    }

    public XmagicProperty<XmagicProperty.XmagicPropertyValues> setCurrentDisPlayValue(XmagicProperty<XmagicProperty.XmagicPropertyValues> property, int value) {
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
        TUIBeautyMaterialDownloader materialDownloader;
        String libPath = TUIBeautySPUtils.get().getString(KEY_IS_LIBS_LOAD);
        if (!TextUtils.isEmpty(libPath)) {
            XmagicApi.setLibPathAndLoad(libPath);
            LicenceCheck.getInstance().setXMagicLicense(mContext, mLicenseUrl, mLicenseKey);
            LicenceCheck.getInstance().setListener(new LicenceCheck.LicenceCheckListener() {
                @Override
                public void onLicenceLoaded(int result, String reason) {
                    //在2.4.0版本，如果无需下载，或者下载失败，不会回调这个方法。（后续版本会补齐）
                    //如果有下载，且下载成功，会回调。result为LicenceCheck.ERROR_OK表示下载下来的license文件是有效的
                    if (result == LicenceCheck.ERROR_OK) {
                        checkAuth(mContext);
                    }
                }
            });
            checkAuth(mContext);
            return;
        }
        if (isCpuV8a()) {
            materialDownloader = new TUIBeautyMaterialDownloader(mContext, "amr64-v8a", DOWNLOAD_URL_LIBS_V8A);
        } else {
            materialDownloader = new TUIBeautyMaterialDownloader(mContext, "armeabi-v7a", DOWNLOAD_URL_LIBS_V7A);
        }

        materialDownloader.start(new TUIBeautyDownloadListener() {
            @Override
            public void onDownloadFail(String errorMsg) {
                if (mProgressDialog != null) {
                    mProgressDialog.dismiss();
                }
                ToastUtil.toastShortMessage(errorMsg);
            }

            @Override
            public void onDownloadProgress(final int progress) {
                ((Activity) mContext).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Log.i(TAG, "onDownloadProgress, progress = " + progress);
                        if (mProgressDialog == null) {
                            mProgressDialog = new TUIBeautyProgressDialog();
                            mProgressDialog.createLoadingDialog(mContext);
                            mProgressDialog.setCancelable(false);               // 设置是否可以通过点击Back键取消
                            mProgressDialog.setCanceledOnTouchOutside(false);   // 设置在点击Dialog外是否取消Dialog进度条
                            mProgressDialog.show();
                        }
                        mProgressDialog.setMsg(progress + "%");
                    }
                });
            }

            @Override
            public void onDownloadSuccess(final String filePath) {
                ((Activity) mContext).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mProgressDialog != null) {
                            mProgressDialog.dismiss();
                            mProgressDialog = null;
                        }
                    }
                });

                XmagicApi.setLibPathAndLoad(filePath);
                TUIBeautySPUtils.get().put(KEY_IS_LIBS_LOAD, filePath);
                LicenceCheck.getInstance().setXMagicLicense(mContext, mLicenseUrl, mLicenseKey);
                LicenceCheck.getInstance().setListener(new LicenceCheck.LicenceCheckListener() {
                    @Override
                    public void onLicenceLoaded(int result, String reason) {
                        //在2.4.0版本，如果无需下载，或者下载失败，不会回调这个方法。（后续版本会补齐）
                        //如果有下载，且下载成功，会回调。result为LicenceCheck.ERROR_OK表示下载下来的license文件是有效的
                        if (result == LicenceCheck.ERROR_OK) {
                            checkAuth(mContext);
                        }
                    }
                });
                checkAuth(mContext);
            }
        }, true, false);
    }

    public int processVideoFrame(int srcTextureId, int textureWidth, int textureHeight) {
        if (mXmagicApi == null) {
            return srcTextureId;
        }
        return mXmagicApi.process(srcTextureId, textureWidth, textureHeight);
    }

    private boolean isCpuV8a() {
        String cpuType = null;
        try {
            cpuType = new BufferedReader(new InputStreamReader(Runtime.getRuntime().exec(
                    "getprop ro.product.cpu.abi").getInputStream())).readLine();
        } catch (IOException e) {
            e.printStackTrace();
        }
        if (cpuType != null && cpuType.contains("arm64-v8a")) {
            return true;
        }
        return false;
    }

    private void initXmagicApi() {
        setResPath(new File(mContext.getFilesDir(), "xmagic/res").getAbsolutePath());
        //copy本地必须资源
        copyRes(mContext.getApplicationContext());
        mXmagicApi = new XmagicApi(mContext, getResPath(), new XmagicApi.OnXmagicPropertyErrorListener() {
            @Override
            public void onXmagicPropertyError(String s, int i) {
                TXCLog.e(TAG, "onXmagicPropertyError,code:" + i + ",msg:" + s);
                ToastUtil.toastLongMessage("init Xmagic error");

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
}
