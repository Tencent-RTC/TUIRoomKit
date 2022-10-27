package com.tencent.qcloud.tuikit.tuibeauty.view.internal;

import android.app.Dialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.tencent.qcloud.tuikit.tuibeauty.R;

public class TUIBeautyProgressDialog {
    private Dialog   mDialog;
    private TextView mTextMsg;

    public void createLoadingDialog(Context context) {
        LayoutInflater inflater = LayoutInflater.from(context);
        View v = inflater.inflate(R.layout.tuibeauty_layout_loading, null);

        ImageView spaceshipImage = (ImageView) v.findViewById(R.id.beauty_iv_progress_img);
        mTextMsg = (TextView) v.findViewById(R.id.beauty_tv_msg);
        Animation hyperspaceJumpAnimation = AnimationUtils.loadAnimation(context,
                R.anim.tuibeauty_load_progress_animation);
        spaceshipImage.startAnimation(hyperspaceJumpAnimation);

        LinearLayout layout = (LinearLayout) v.findViewById(R.id.beauty_ll_progress);
        mDialog = new Dialog(context, R.style.TUIBeautyLoadingDialog);
        mDialog.setCancelable(false);
        mDialog.setContentView(layout, new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT));
    }

    public void setCancelable(boolean cancelable) {
        if (mDialog != null) {
            mDialog.setCancelable(cancelable);
        }
    }

    public void setCanceledOnTouchOutside(boolean canceledOnTouchOutside) {
        if (mDialog != null) {
            mDialog.setCanceledOnTouchOutside(canceledOnTouchOutside);
        }
    }

    public void show() {
        if (mDialog != null) {
            mDialog.show();
        }
    }

    public void dismiss() {
        if (mDialog != null) {
            mDialog.dismiss();
        }
    }

    public void setMsg(String msg) {
        if (mTextMsg == null) {
            return;
        }
        if (mTextMsg.getVisibility() == View.GONE) {
            mTextMsg.setVisibility(View.VISIBLE);
        }
        mTextMsg.setText(msg);
    }
}
