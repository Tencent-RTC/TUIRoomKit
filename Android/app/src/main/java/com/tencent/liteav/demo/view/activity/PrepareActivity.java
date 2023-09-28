package com.tencent.liteav.demo.view.activity;

import android.os.Bundle;
import android.view.ViewGroup;

import androidx.appcompat.app.AppCompatActivity;

import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.liteav.demo.R;
import com.tencent.liteav.demo.view.component.PrepareView;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;

public class PrepareActivity extends AppCompatActivity {
    public static final String INTENT_ENABLE_PREVIEW = "enablePreview";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroomkit_activity_prepare);
        ViewGroup root = findViewById(R.id.ll_root);
        boolean enablePreview = getIntent().getBooleanExtra(INTENT_ENABLE_PREVIEW, true);
        PrepareView prepareView = new PrepareView(this, enablePreview);
        root.addView(prepareView);
        prepareView.setFinishCallback(new TUICallback() {
            @Override
            public void onSuccess() {
                finish();
            }

            @Override
            public void onError(int errorCode, String errorMessage) {

            }
        });
        TUIRoomKit.createInstance();
    }
}