package com.tencent.liteav.tuiroom.ui.widget.page;

import android.util.Log;

public class PagerConfig {
    private static final String  TAG                  = "RoomPagerGrid";
    private static       boolean sShowLog             = false;
    private static       int     sFlingThreshold      = 1000;
    private static       float   sMillisecondsPreInch = 60f;

    public static boolean isShowLog() {
        return sShowLog;
    }

    public static void setShowLog(boolean showLog) {
        sShowLog = showLog;
    }

    public static int getFlingThreshold() {
        return sFlingThreshold;
    }

    public static void setFlingThreshold(int flingThreshold) {
        sFlingThreshold = flingThreshold;
    }

    public static float getMillisecondsPreInch() {
        return sMillisecondsPreInch;
    }

    public static void setMillisecondsPreInch(float millisecondsPreInch) {
        sMillisecondsPreInch = millisecondsPreInch;
    }

    public static void info(String msg) {
        if (!PagerConfig.isShowLog()) {
            return;
        }
        Log.i(TAG, msg);
    }

    public static void error(String msg) {
        if (!PagerConfig.isShowLog()) {
            return;
        }
        Log.e(TAG, msg);
    }
}
