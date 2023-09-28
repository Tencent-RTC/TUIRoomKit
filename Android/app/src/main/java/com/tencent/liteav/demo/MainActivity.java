package com.tencent.liteav.demo;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;

import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.liteav.demo.view.activity.PrepareActivity;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.TUIThemeManager;
import com.tencent.qcloud.tuicore.util.TUIBuild;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.HashMap;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private String TAG = "MainActivity";

    private Context mContext;
    private ConstraintLayout mMeetingLayout;
    private ConstraintLayout mH5MeetingLayout;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.app_activity_main_layout);
        initStatusBar();

        mContext = this.getApplicationContext();
        ImageView mainIconView = findViewById(R.id.img_main_icon);
        mainIconView.setBackgroundResource(R.drawable.app_title_zh);
        if (TextUtils.equals(getCurrentLanguage(), "en")) {
            mainIconView.setBackgroundResource(R.drawable.app_title_en);
        }
        mMeetingLayout= findViewById(R.id.app_cl_item_meeting);
        mMeetingLayout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                enterPrepareView(true);
            }
        });
    }

    private void initStatusBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }
    }

    public void enterPrepareView(boolean enablePreview) {
        Log.i(TAG, "enter prepare view enablePreview=" + enablePreview);
        if (RoomEngineManager.sharedInstance(mContext).getRoomStore().isInFloatWindow()) {
            ToastUtil.toastLongMessage(mContext.getString(R.string.tuiroomkit_room_msg_joined));
            return;
        }
        Intent intent = new Intent(mContext, PrepareActivity.class);
        intent.putExtra(PrepareActivity.INTENT_ENABLE_PREVIEW, enablePreview);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        mContext.startActivity(intent);
    }

    private String getCurrentLanguage() {
        String language = TUIThemeManager.getInstance().getCurrentLanguage();
        if (TextUtils.isEmpty(language)) {
            Locale locale;
            if (TUIBuild.getVersionInt() < Build.VERSION_CODES.N) {
                locale = getResources().getConfiguration().locale;
            } else {
                locale = getResources().getConfiguration().getLocales().get(0);
            }
            language = locale.getLanguage();
        }
        return language;
    }
}
