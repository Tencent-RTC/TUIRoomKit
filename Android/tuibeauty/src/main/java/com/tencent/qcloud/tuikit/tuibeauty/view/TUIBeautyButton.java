package com.tencent.qcloud.tuikit.tuibeauty.view;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuikit.tuibeauty.R;

import java.lang.reflect.Method;

/**
 * 美颜功能展开按钮
 */
public class TUIBeautyButton extends FrameLayout {

    private ImageView       mBeautyIcon;
    private TUIBeautyView   mBeautyPanel;
    private TXBeautyManager mBeautyManager;


    public TUIBeautyButton(Context context, TXBeautyManager beautyManager) {
        super(context);
        mBeautyManager = beautyManager;
        initView(context);
    }

    public TUIBeautyButton(Context context, TXBeautyManager beautyManager, int resId) {
        this(context, beautyManager);
        mBeautyIcon.setImageResource(resId);
    }

    private void initView(final Context context) {
        View baseView = LayoutInflater.from(context).inflate(R.layout.tuibeauty_view_extention, this);
        mBeautyIcon = findViewById(R.id.iv_link_dialog);
        mBeautyPanel = new TUIBeautyView(context, mBeautyManager);
        mBeautyIcon.setOnClickListener(new OnClickListener() {
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
