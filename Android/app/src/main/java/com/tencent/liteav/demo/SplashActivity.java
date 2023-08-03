package com.tencent.liteav.demo;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import androidx.annotation.Nullable;

import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKitListener;
import com.tencent.cloud.tuikit.roomkit.utils.UserModel;
import com.tencent.cloud.tuikit.roomkit.utils.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.util.ToastUtil;

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
        userModel.userSig = GenerateTestUserSig.genTestUserSig(userModel.userId);
        String userName = TextUtils.isEmpty(userModel.userName) ? userModel.userId : userModel.userName;
        TUIRoomKit roomKit = TUIRoomKit.sharedInstance(this);
        roomKit.addListener(new TUIRoomKitListener() {
            @Override
            public void onLogin(int code, String message) {
                if (code == 0) {
                    roomKit.setSelfInfo(userName, userModel.userAvatar);
                    TUICore.startActivity("MainActivity", null);
                    finish();
                } else {
                    ToastUtil.toastShortMessage("tuiroomkit login error:" + code + ",msg:" + message);
                    UserModelManager.getInstance().clearUserModel();
                    Log.i(TAG, "login error:" + code + ",msg:" + message);
                }
            }

            @Override
            public void onRoomCreate(int code, String message) {

            }

            @Override
            public void onRoomEnter(int code, String message) {

            }

            @Override
            public void onDestroyRoom() {

            }

            @Override
            public void onExitRoom() {

            }
        });
        roomKit.login(GenerateTestUserSig.SDKAPPID, userModel.userId, userModel.userSig);
    }
}
