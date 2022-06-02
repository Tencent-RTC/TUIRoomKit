package com.tencent.qcloud.tuikit.tuibeauty.model.utils;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.NonNull;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;

/**
 * 美颜下载数据存储,数据库工具类
 */
public class TUIBeautySPUtils {
    private static final String SP_NAME_DEFAULT = "beauty_default";

    private static TUIBeautySPUtils  sInstance;
    private        SharedPreferences mSharedPreferences;

    public static TUIBeautySPUtils get() {
        return get(SP_NAME_DEFAULT, Context.MODE_PRIVATE);
    }

    public static TUIBeautySPUtils get(final int mode) {
        return get(SP_NAME_DEFAULT, mode);
    }

    public static TUIBeautySPUtils get(String spName) {
        return get(spName, Context.MODE_PRIVATE);
    }

    public static TUIBeautySPUtils get(String spName, final int mode) {
        if (sInstance == null) {
            synchronized (TUIBeautySPUtils.class) {
                if (sInstance == null) {
                    sInstance = new TUIBeautySPUtils(spName, mode);
                }
            }
        }
        return sInstance;
    }

    private TUIBeautySPUtils(final String spName, final int mode) {
        mSharedPreferences = TUIBeautyResourceParse.getApplication().getSharedPreferences(spName, mode);
    }

    public void put(@NonNull final String key, final String value) {
        put(key, value, false);
    }

    public void put(@NonNull final String key, final String value, final boolean isCommit) {
        if (isCommit) {
            mSharedPreferences.edit().putString(key, value).commit();
        } else {
            mSharedPreferences.edit().putString(key, value).apply();
        }
    }

    public String getString(@NonNull final String key) {
        return getString(key, "");
    }

    public String getString(@NonNull final String key, final String defaultValue) {
        return mSharedPreferences.getString(key, defaultValue);
    }
}
