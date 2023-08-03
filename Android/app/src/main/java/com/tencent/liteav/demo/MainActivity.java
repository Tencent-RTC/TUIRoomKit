package com.tencent.liteav.demo;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;

import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.qcloud.tuicore.TUIThemeManager;
import com.tencent.qcloud.tuicore.util.TUIBuild;

import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.app_activity_main_layout);
        initStatusBar();

        ImageView mainIconView = findViewById(R.id.img_main_icon);
        mainIconView.setBackgroundResource(R.drawable.app_title_zh);
        if (TextUtils.equals(getCurrentLanguage(), "en")) {
            mainIconView.setBackgroundResource(R.drawable.app_title_en);
        }
        ConstraintLayout layout = findViewById(R.id.app_cl_item_meeting);
        layout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                TUIRoomKit.sharedInstance(MainActivity.this.getApplicationContext()).enterPrepareView(true);
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
