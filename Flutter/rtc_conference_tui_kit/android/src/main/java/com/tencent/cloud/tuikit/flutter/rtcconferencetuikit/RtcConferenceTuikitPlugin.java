package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.service.ForegroundService;

import java.lang.reflect.Method;

import io.flutter.embedding.engine.plugins.FlutterPlugin;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel.Result;

public class RtcConferenceTuikitPlugin implements FlutterPlugin, MethodCallHandler {
    private static final String TAG = "rtc_conference_tuikit";

    private MethodChannel mChannel;
    private Context       mApplicationContext;

    @Override
    public void onAttachedToEngine(@NonNull FlutterPluginBinding flutterPluginBinding) {
        mChannel = new MethodChannel(flutterPluginBinding.getBinaryMessenger(), "rtc_conference_tuikit");
        mChannel.setMethodCallHandler(this);
        mApplicationContext = flutterPluginBinding.getApplicationContext();
    }

    @Override
    public void onMethodCall(@NonNull MethodCall call, @NonNull Result result) {
        try {
            Method method = RtcConferenceTuikitPlugin.class
            .getDeclaredMethod(call.method, MethodCall.class, MethodChannel.Result.class);
            method.invoke(this, call, result);
        } catch (Exception e) {
            Log.e(TAG, "onMethodCall |method=" + call.method + "|arguments=" + call.arguments + "|error=" + e);
            e.printStackTrace();
        }
    }

    @Override
    public void onDetachedFromEngine(@NonNull FlutterPluginBinding binding) {
        mChannel.setMethodCallHandler(null);
    }

    public void startForegroundService(MethodCall call, MethodChannel.Result result) {
        ForegroundService.startForegroundService(mApplicationContext);
        result.success(0);
    }

    public void stopForegroundService(MethodCall call, MethodChannel.Result result) {
        ForegroundService.stopForegroundService(mApplicationContext);
        result.success(0);
    }
}
