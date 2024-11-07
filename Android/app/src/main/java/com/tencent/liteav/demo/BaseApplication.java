package com.tencent.liteav.demo;

import static com.tencent.cloud.tuikit.roomkit.ConferenceDefine.KEY_JOIN_CONFERENCE_PARAMS;
import static com.tencent.cloud.tuikit.roomkit.model.ConferenceEventCenter.RoomKitUIEvent.START_LOGIN;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.StrictMode;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.multidex.MultiDexApplication;

import com.tencent.cloud.tuikit.roomkit.ConferenceDefine;
import com.tencent.cloud.tuikit.roomkit.ConferenceMainActivity;
import com.tencent.cloud.tuikit.roomkit.common.utils.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.ConferenceEventCenter;
import com.tencent.cloud.tuikit.roomkit.common.utils.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.ITUINotification;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;

import org.json.JSONObject;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.LinkedList;
import java.util.Map;

public class BaseApplication extends MultiDexApplication implements ConferenceEventCenter.RoomKitUIEventResponder {
    private static final String TAG = "BaseApplication";

    private static final String CONFERENCE_WILL_START = "conference_will_start";

    private LinkedList<Activity> mActivityList = new LinkedList<>();

    @Override
    public void onCreate() {
        super.onCreate();
        StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
        StrictMode.setVmPolicy(builder.build());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
            builder.detectFileUriExposure();
        }
        closeAndroidPDialog();
        ConferenceEventCenter.getInstance().subscribeUIEvent(START_LOGIN, this);
        registerActivityLifecycleCallbacks(activityLifecycleCallbacks);
        registerConferenceNotificationEvent();
    }

    private void registerConferenceNotificationEvent() {
        TUICore.registerEvent(TUIConstants.TIMPush.EVENT_NOTIFY, TUIConstants.TIMPush.EVENT_NOTIFY_NOTIFICATION, new ITUINotification() {
            @Override
            public void onNotifyEvent(String key, String subKey, Map<String, Object> param) {
                Log.d(TAG, "onNotifyEvent key = " + key + "subKey = " + subKey);
                if (TUIConstants.TIMPush.EVENT_NOTIFY.equals(key) && TUIConstants.TIMPush.EVENT_NOTIFY_NOTIFICATION.equals(subKey) && param != null) {
                    login(new TUICallback() {
                        @Override
                        public void onSuccess() {
                            String extString = (String) param.get(TUIConstants.TIMPush.NOTIFICATION_EXT_KEY);
                            try {
                                JSONObject roomObject = new JSONObject(extString);
                                String notificationType = roomObject.getString("NotificationType");
                                if (CONFERENCE_WILL_START.equals(notificationType)) {
                                    String roomId = roomObject.getString("RoomId");
                                    enterRoom(roomId);
                                } else {
                                    Intent intent = new Intent(getApplicationContext(), mActivityList.isEmpty() ? SplashActivity.class : mActivityList.getLast().getClass());
                                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    getApplicationContext().startActivity(intent);
                                }
                            } catch (Exception e) {
                                Log.d(TAG, "onNotifyEvent json exception: " + e.getMessage());
                            }
                        }

                        @Override
                        public void onError(int errorCode, String errorMessage) {

                        }
                    });
                }
            }
        });
    }

    private void enterRoom(String roomId) {
        ConferenceDefine.JoinConferenceParams params = new ConferenceDefine.JoinConferenceParams(roomId);
        Intent intent = new Intent(getApplicationContext(), ConferenceMainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.putExtra(KEY_JOIN_CONFERENCE_PARAMS, params);
        getApplicationContext().startActivity(intent);
    }

    private void login(TUICallback callback) {
        final UserModel userModel = UserModelManager.getInstance().getUserModel();
        int sdkAppId = GenerateTestUserSig.SDKAppID;
        String userId = userModel.userId;
        String userSig = GenerateTestUserSig.genTestUserSig(userModel.userId);
        Log.d(TAG, "TUILogin.login sdkAppId=" + sdkAppId + " userId=" + userId + " userSig=" + TextUtils.isEmpty(userSig));
        TUILogin.login(this.getApplicationContext(), sdkAppId, userId, userSig, new TUICallback() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "TUILogin.login onSuccess");
                if (callback != null) {
                    callback.onSuccess();
                }
            }

            @Override
            public void onError(int errorCode, String errorMessage) {
                Log.d(TAG, "TUILogin.login onError errorCode=" + errorCode + " errorMessage=" + errorMessage);
                if (callback != null) {
                    callback.onError(errorCode, errorMessage);
                }
                UserModelManager.getInstance().clearUserModel();
            }
        });
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        Log.i(TAG, "on receive event key=" + key);
        if (START_LOGIN.equals(key)) {
            UserModelManager.getInstance().clearUserModel();
            for (Activity activity : mActivityList) {
                activity.finish();
            }
            TUICore.startActivity("LoginActivity", null);
        }
    }

    private ActivityLifecycleCallbacks activityLifecycleCallbacks = new ActivityLifecycleCallbacks() {
        @Override
        public void onActivityCreated(@NonNull Activity activity, @Nullable Bundle savedInstanceState) {
            mActivityList.add(activity);
        }

        @Override
        public void onActivityStarted(@NonNull Activity activity) {

        }

        @Override
        public void onActivityResumed(@NonNull Activity activity) {

        }

        @Override
        public void onActivityPaused(@NonNull Activity activity) {

        }

        @Override
        public void onActivityStopped(@NonNull Activity activity) {

        }

        @Override
        public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {

        }

        @Override
        public void onActivityDestroyed(@NonNull Activity activity) {
            mActivityList.remove(activity);
        }
    };

    private void closeAndroidPDialog() {
        try {
            Class aClass = Class.forName("android.content.pm.PackageParser$Package");
            Constructor declaredConstructor = aClass.getDeclaredConstructor(String.class);
            declaredConstructor.setAccessible(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
        try {
            Class cls = Class.forName("android.app.ActivityThread");
            Method declaredMethod = cls.getDeclaredMethod("currentActivityThread");
            declaredMethod.setAccessible(true);
            Object activityThread = declaredMethod.invoke(null);
            Field mHiddenApiWarningShown = cls.getDeclaredField("mHiddenApiWarningShown");
            mHiddenApiWarningShown.setAccessible(true);
            mHiddenApiWarningShown.setBoolean(activityThread, true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}