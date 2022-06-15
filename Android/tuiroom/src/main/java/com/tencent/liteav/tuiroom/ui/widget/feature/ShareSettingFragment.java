package com.tencent.liteav.tuiroom.ui.widget.feature;

import android.view.View;
import android.widget.Button;

import com.tencent.liteav.tuiroom.ui.widget.base.BaseSettingFragment;
import com.tencent.liteav.tuiroom.R;

public class ShareSettingFragment extends BaseSettingFragment {
    private static final String TAG = ShareSettingFragment.class.getName();

    private OnShareButtonClickListener mListener;
    private Button                     mShare;
    private boolean                    mEnableShare = true;

    @Override
    protected void initView(View itemView) {
        mShare = (Button) itemView.findViewById(R.id.share);
        mShare.setEnabled(mEnableShare);
        mShare.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mListener != null) {
                    mListener.onClick();
                }
            }
        });
    }

    public void setShareButtonClickListener(OnShareButtonClickListener listener) {
        mListener = listener;
    }

    @Override
    protected int getLayoutId() {
        return R.layout.tuiroom_fragment_share_setting;
    }

    public void enableShareButton(boolean enable) {
        mEnableShare = enable;
        if (mShare != null) {
            mShare.setEnabled(enable);
        }
    }

    public interface OnShareButtonClickListener {
        void onClick();
    }
}
