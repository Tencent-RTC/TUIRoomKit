package com.tencent.liteav.demo;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.Nullable;

import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.utils.UserModel;
import com.tencent.cloud.tuikit.roomkit.utils.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;
import com.tencent.qcloud.tuicore.TUIConfig;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;

public class SplashActivity extends Activity {
    private static final String TAG = "SplashActivity";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        navigation();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        Log.d(TAG, "onNewIntent: intent -> " + intent.getData());
        setIntent(intent);
        navigation();
    }

    private void navigation() {
        UserModelManager userModelManager = UserModelManager.getInstance();
        String userId = userModelManager.getUserModel().userId;
        if (TextUtils.isEmpty(userId)) {
            Intent intent = new Intent(this, LoginActivity.class);
            startActivity(intent);
            finish();
        } else {
            startPrepareActivity();
        }
    }

    private void startPrepareActivity() {
        final UserModel userModel = UserModelManager.getInstance().getUserModel();
        int sdkAppId = GenerateTestUserSig.SDKAppID;
        String userId = userModel.userId;
        String userSig = GenerateTestUserSig.genTestUserSig(userModel.userId);
        Log.d(TAG,
                "TUILogin.login sdkAppId=" + sdkAppId + " userId=" + userId + " userSig=" + TextUtils.isEmpty(userSig));
        TUILogin.login(this.getApplicationContext(), sdkAppId, userId, userSig, new TUICallback() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "TUILogin.login onSuccess");
                String userName = TextUtils.isEmpty(userModel.userName) ? userModel.userId : userModel.userName;
                TUIRoomEngine.setSelfInfo(userName, userModel.userAvatar, null);
                TUIConfig.setSelfNickName(userName);
                TUIConfig.setSelfFaceUrl(userModel.userAvatar);
                TUICore.startActivity("PrepareActivity", null);
                finish();
            }

            @Override
            public void onError(int errorCode, String errorMessage) {
                Log.d(TAG, "TUILogin.login onError errorCode=" + errorCode + " errorMessage=" + errorMessage);
                UserModelManager.getInstance().clearUserModel();
            }
        });
    }
}
