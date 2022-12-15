package com.tencent.liteav.basic;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

public class Constants {
    public static final String URL_PUSH = "url_push";       // RTMP 推流地址
    public static final String URL_PLAY_FLV = "url_play_flv";   // FLV  播放地址
    public static final String POPULAR_RECOMMENDATION_BEAN_KEY = "popular_recommendation_bean_key";

    public static final int APP_ID = 1500005830;

    public static final int NOT_SELECTED = -1;

    public static boolean isNetworkConnected(Context context) {
        if (context != null) {
            ConnectivityManager mConnectivityManager = (ConnectivityManager) context.getApplicationContext()
                    .getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkInfo mNetworkInfo = mConnectivityManager.getActiveNetworkInfo();
            if (mNetworkInfo != null) {
                return mNetworkInfo.isAvailable();
            }
        }
        return false;
    }
}
