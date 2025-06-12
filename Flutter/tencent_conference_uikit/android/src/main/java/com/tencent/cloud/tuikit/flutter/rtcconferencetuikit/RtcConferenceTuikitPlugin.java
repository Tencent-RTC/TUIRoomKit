package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit;

import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.floatwindow.FloatWindowManager;
import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.floatwindow.UserModel;
import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.service.ForegroundService;
import com.tencent.qcloud.tuicore.permission.PermissionRequester;

import java.lang.reflect.Method;
import java.util.HashMap;

import io.flutter.embedding.engine.plugins.FlutterPlugin;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel.Result;

public class RtcConferenceTuikitPlugin implements FlutterPlugin, MethodCallHandler {
    private static final String TAG = "rtc_conference_tuikit";

    private MethodChannel      mChannel;
    private Context            mApplicationContext;
    private FloatWindowManager mFloatWindowManager;

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
        if (mFloatWindowManager != null) {
            mFloatWindowManager.dismiss();
        }
    }

    public void startForegroundService(MethodCall call, MethodChannel.Result result) {
        ForegroundService.startForegroundService(mApplicationContext);
        result.success(0);
    }

    public void stopForegroundService(MethodCall call, MethodChannel.Result result) {
        ForegroundService.stopForegroundService(mApplicationContext);
        result.success(0);
    }

    public void enableFloatWindow(MethodCall call, MethodChannel.Result result) {
        boolean isEnable = call.argument("enable");
        if (isEnable) {
            long showResult = showFloatWindow();
            result.success(showResult);
        } else {
            dismissFloatWindow();
            result.success(0);
        }
    }

    private long showFloatWindow() {
        if (mFloatWindowManager == null) {
            mFloatWindowManager = new FloatWindowManager(mApplicationContext);
            mFloatWindowManager.setObserver(new FloatWindowManager.FloatWindowObserver() {
                @Override
                public void onFloatWindowClick() {
                    mFloatWindowManager.dismiss();
                    onFloatWindowClicked();
                }
            });
        }

        return mFloatWindowManager.show();
    }

    private void dismissFloatWindow() {
        if (mFloatWindowManager == null) {
            return;
        }

        mFloatWindowManager.dismiss();
    }

    private void onFloatWindowClicked() {
        launchMainActivity(mApplicationContext);
        mChannel.invokeMethod("onFloatWindowClicked", new HashMap<>(), null);
    }

    private void launchMainActivity(Context context) {
        PermissionRequester requester = PermissionRequester.newInstance(PermissionRequester.BG_START_PERMISSION);
        if (!requester.has()) {
            return;
        }
        Intent intentLaunchMain = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intentLaunchMain == null) {
            return;
        }
        intentLaunchMain.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intentLaunchMain);
    }

    public void updateFloatWindowUserModel(MethodCall call, MethodChannel.Result result) {
        if (mFloatWindowManager == null) {
            result.error("-1", "float window is not enabled", null);
            return;
        }
        UserModel userModel = new UserModel();
        userModel.userId = call.argument("userId");
        userModel.userName = call.argument("userName");
        userModel.userAvatarURL = call.argument("avatar");
        userModel.userRole = TUIRoomDefine.Role.fromInt(call.argument("role"));
        userModel.hasAudioStream = Boolean.TRUE.equals(call.argument("hasAudioStream"));
        userModel.hasVideoStream = Boolean.TRUE.equals(call.argument("hasVideoStream"));
        userModel.hasScreenStream = Boolean.TRUE.equals(call.argument("hasScreenStream"));
        userModel.volume = call.argument("volume");
        mFloatWindowManager.updateUserModel(userModel);
    }


}
