package com.tencent.liteav.demo;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKitListener;
import com.tencent.cloud.tuikit.roomkit.utils.ImageLoader;
import com.tencent.cloud.tuikit.roomkit.utils.UserModel;
import com.tencent.cloud.tuikit.roomkit.utils.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ProfileActivity extends AppCompatActivity {
    private static final String    TAG = "ProfileActivity";
    private              ImageView mImageAvatar;
    private              EditText  mEditUserName;
    private              Button    mButtonRegister;
    private              TextView  mTvInputTips;
    private              String    mAvatarUrl;

    private static final int[] CUSTOM_NAME_ARRAY = {
            R.string.app_custom_name_1,
            R.string.app_custom_name_2,
            R.string.app_custom_name_3,
            R.string.app_custom_name_4,
            R.string.app_custom_name_5,
            R.string.app_custom_name_6,
            R.string.app_custom_name_7,
            R.string.app_custom_name_8,
            R.string.app_custom_name_9,
            R.string.app_custom_name_10,
            R.string.app_custom_name_11,
            R.string.app_custom_name_12,
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.app_activity_login_profile);
        initStatusBar();
        initView();
    }

    private void initView() {
        mImageAvatar = (ImageView) findViewById(R.id.iv_user_avatar);
        mEditUserName = (EditText) findViewById(R.id.et_user_name);
        mButtonRegister = (Button) findViewById(R.id.tv_register);
        mTvInputTips = (TextView) findViewById(R.id.tv_tips_user_name);
        String[] avatarArr = AvatarConstant.USER_AVATAR_ARRAY;
        int index = new Random().nextInt(avatarArr.length);
        mAvatarUrl = avatarArr[index];
        ImageLoader.loadImage(this, mImageAvatar, mAvatarUrl, R.drawable.app_ic_avatar);

        mButtonRegister.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setProfile();
            }
        });
        int customNameIndex = new Random().nextInt(CUSTOM_NAME_ARRAY.length);
        mEditUserName.setText(getString(CUSTOM_NAME_ARRAY[customNameIndex]));
        String text = mEditUserName.getText().toString();
        if (!TextUtils.isEmpty(text)) {
            mEditUserName.setSelection(text.length());
        }
        mEditUserName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence text, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence text, int start, int before, int count) {
                mButtonRegister.setEnabled(text.length() != 0);
                String editable = mEditUserName.getText().toString();
                Pattern p = Pattern.compile("^[a-z0-9A-Z\\u4e00-\\u9fa5\\_]{2,20}$");
                Matcher m = p.matcher(editable);
                if (!m.matches()) {
                    mTvInputTips.setTextColor(getResources().getColor(R.color.color_input_no_match));
                } else {
                    mTvInputTips.setTextColor(getResources().getColor(R.color.text_color_hint));
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });
    }

    private void setProfile() {
        final String userName = mEditUserName.getText().toString().trim();
        if (TextUtils.isEmpty(userName)) {
            ToastUtil.toastLongMessage(getString(R.string.app_hint_user_name));
            return;
        }
        String reg = "^[a-z0-9A-Z\\u4e00-\\u9fa5\\_]{2,20}$";
        if (!userName.matches(reg)) {
            mTvInputTips.setTextColor(getResources().getColor(R.color.color_input_no_match));
            return;
        }
        mTvInputTips.setTextColor(getResources().getColor(R.color.text_color_hint));
        UserModel model = UserModelManager.getInstance().getUserModel();
        model.userName = userName;
        model.userAvatar = mAvatarUrl;
        UserModelManager.getInstance().setUserModel(model);
        Log.i(TAG, "set profile success.");
        ToastUtil.toastLongMessage(getString(R.string.app_toast_register_success_and_logging_in));
        startPrepareActivity();
    }

    private void startPrepareActivity() {
        final UserModel userModel = UserModelManager.getInstance().getUserModel();
        String userName = TextUtils.isEmpty(userModel.userName) ? userModel.userId : userModel.userName;
        TUIRoomKit roomKit = TUIRoomKit.sharedInstance(this);
        roomKit.addListener(new TUIRoomKitListener() {
            @Override
            public void onLogin(int code, String message) {
                if (code == 0) {
                    roomKit.setSelfInfo(userName, userModel.userAvatar);
                    roomKit.enterPrepareView(true);
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

    private void initStatusBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }
    }
}
