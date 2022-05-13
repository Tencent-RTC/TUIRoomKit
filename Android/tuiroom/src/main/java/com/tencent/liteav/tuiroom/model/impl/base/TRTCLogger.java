package com.tencent.liteav.tuiroom.model.impl.base;

import com.tencent.liteav.basic.log.TXCLog;

public class TRTCLogger {
    private static final String TAG = "TUIRoom:";

    public static void e(String tag, String message) {
        TXCLog.e(TAG + tag, message);
        callback("e", tag, message);
    }

    public static void w(String tag, String message) {
        TXCLog.w(TAG + tag, message);
        callback("w", tag, message);
    }

    public static void i(String tag, String message) {
        TXCLog.i(TAG + tag, message);
        callback("i", tag, message);
    }

    public static void d(String tag, String message) {
        TXCLog.d(TAG + tag, message);
        callback("d", tag, message);
    }

    private static void callback(String level, String tag, String message) {
    }
}
