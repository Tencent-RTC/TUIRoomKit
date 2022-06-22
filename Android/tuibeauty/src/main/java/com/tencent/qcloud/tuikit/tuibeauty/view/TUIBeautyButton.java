package com.tencent.qcloud.tuikit.tuibeauty.view;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuikit.tuibeauty.R;

import java.lang.reflect.Method;

/**
 * 美颜功能展开按钮
 */
public class TUIBeautyButton extends FrameLayout {

    private TUIBeautyView   mBeautyPanel;
    private TXBeautyManager mBeautyManager;

    public TUIBeautyButton(Context context, TXBeautyManager beautyManager) {
        super(context);
        mBeautyManager = beautyManager;
        initView(context);
    }

    private void initView(final Context context) {
        View baseView = LayoutInflater.from(context).inflate(R.layout.tuibeauty_view_extention, this);

        mBeautyPanel = new TUIBeautyView(context, mBeautyManager);
        findViewById(R.id.iv_link_dialog).setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                showBeautyDialog();
            }
        });
    }

    private void showBeautyDialog() {
        boolean isAuth = true;
        try {
            Class clz = Class.forName("com.tencent.liteav.privacy.util.RTCubeAppLegalUtils");
            Method method = clz.getDeclaredMethod("showBeautyAuthDialog", Context.class);
            isAuth = (Boolean) method.invoke(null, getContext());
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (isAuth && !mBeautyPanel.isShowing()) {
                mBeautyPanel.show();
            }
        }
    }

}
