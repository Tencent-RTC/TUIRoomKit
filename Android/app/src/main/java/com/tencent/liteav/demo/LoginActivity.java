package com.tencent.liteav.demo;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.text.InputFilter;
import android.text.Spanned;
import android.text.TextUtils;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.tencent.cloud.tuikit.roomkit.common.utils.UserModel;
import com.tencent.cloud.tuikit.roomkit.common.utils.UserModelManager;
import com.tencent.liteav.debug.GenerateTestUserSig;

import java.util.Random;

public class LoginActivity extends AppCompatActivity {
    private static final String TAG = LoginActivity.class.getName();

    private EditText mEditUserId;
    private Button   mButtonLogin;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.app_activity_login);
        initStatusBar();
        initView();
    }

    private void initView() {
        mEditUserId = (EditText) findViewById(R.id.et_userId);
        InputFilter[] filters = new InputFilter[]{new UserIdInputFilter()};
        mEditUserId.setFilters(filters);
        initButtonLogin();
    }

    private void initButtonLogin() {
        mButtonLogin = (Button) findViewById(R.id.tv_login);
        mButtonLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                login();
            }
        });
    }

    private void login() {
        String userId = mEditUserId.getText().toString().trim();
        if (TextUtils.isEmpty(userId)) {
            Toast.makeText(this, getString(R.string.app_user_id_empty_toast), Toast.LENGTH_SHORT).show();
            return;
        }
        final UserModel userModel = new UserModel();
        userModel.userId = userId;
        int index = new Random().nextInt(AvatarConstant.USER_AVATAR_ARRAY.length);
        userModel.userAvatar = AvatarConstant.USER_AVATAR_ARRAY[index];
        userModel.userSig = GenerateTestUserSig.genTestUserSig(userId);
        final UserModelManager manager = UserModelManager.getInstance();
        manager.setUserModel(userModel);
        Intent intent = new Intent(LoginActivity.this, ProfileActivity.class);
        startActivity(intent);
    }

    private void initStatusBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }
    }

    public class UserIdInputFilter implements InputFilter {
        private static final String ALLOWED_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

        @Override
        public CharSequence filter(CharSequence source, int start, int end, Spanned dest, int dstart, int dend) {
            for (int i = start; i < end; i++) {
                if (!ALLOWED_CHARACTERS.contains(String.valueOf(source.charAt(i)))) {
                    return "";
                }
            }
            return null;
        }
    }
}
