package com.tencent.cloud.tuikit.roomkit.view.component;


import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.viewmodel.MoreFunctionViewModel;

public class MoreFunctionView extends BottomSheetDialog implements View.OnClickListener {

    private Context               mContext;
    private SettingView           mSettingView;
    private LinearLayout          mLayoutChat;
    private LinearLayout          mLayoutBeauty;
    private LinearLayout          mLayoutSetting;
    private MoreFunctionViewModel mViewModel;

    public MoreFunctionView(@NonNull Context context) {
        super(context, R.style.TUIRoomDialogFragmentTheme);
        setContentView(R.layout.tuiroomkit_view_extension);
        mContext = context;
        mViewModel = new MoreFunctionViewModel(mContext);
        initView();
    }

    private void initView() {
        mLayoutChat = findViewById(R.id.ll_item_chat);
        mLayoutBeauty = findViewById(R.id.ll_beauty_icon);
        mLayoutSetting = findViewById(R.id.ll_item_setting);

        mLayoutBeauty.removeAllViews();
        setBeautyView(mViewModel.getBeautyView());

        mLayoutSetting.setOnClickListener(this);
        mLayoutChat.setOnClickListener(this);
    }

    @Override
    public void onDetachedFromWindow() {
        mViewModel.destroy();
        super.onDetachedFromWindow();
    }

    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.ll_item_chat) {
            mViewModel.showChatView();
        } else if (v.getId() == R.id.ll_item_setting) {
            if (mSettingView == null) {
                mSettingView = new SettingView();
            }
            mViewModel.showSettingView(mSettingView, "SettingView");
            dismiss();
        }
    }

    private void setBeautyView(View view) {
        if (view == null) {
            return;
        }
        RelativeLayout.LayoutParams params = new RelativeLayout
                .LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        mLayoutBeauty.addView(view, params);
    }
}
