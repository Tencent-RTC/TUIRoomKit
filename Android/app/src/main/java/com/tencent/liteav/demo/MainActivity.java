package com.tencent.liteav.demo;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;

import androidx.annotation.Nullable;

import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.imsdk.v2.V2TIMSDKListener;
import com.tencent.imsdk.v2.V2TIMUserFullInfo;
import com.tencent.imsdk.v2.V2TIMUserStatus;
import com.tencent.liteav.basic.UserModel;
import com.tencent.liteav.basic.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;

import java.util.List;

public class MainActivity extends Activity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        init();
        Intent intent = new Intent(this, RoomEntranceActivity.class);
        startActivity(intent);
        finish();
    }

    private void init() {
        final UserModel userModel = UserModelManager.getInstance().getUserModel();
        TUIRoomKit.sharedInstance(this).setup(GenerateTestUserSig.SDKAPPID, userModel.userId, userModel.userSig);
        V2TIMManager.getInstance().initSDK(this, GenerateTestUserSig.SDKAPPID, null);
    }
}
