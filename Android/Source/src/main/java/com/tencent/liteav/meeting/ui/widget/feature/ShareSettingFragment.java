package com.tencent.liteav.meeting.ui.widget.feature;

import android.view.View;
import android.widget.Button;

import com.tencent.liteav.demo.trtc.R;
import com.tencent.liteav.meeting.ui.widget.base.BaseSettingFragment;

/**
 * 分享相关配置
 *
 * @author guanyifeng
 */
public class ShareSettingFragment extends BaseSettingFragment {
    private static final String TAG = ShareSettingFragment.class.getName();

    private OnShareButtonClickListener mListener;
    private Button                     mShare;

    @Override
    protected void initView(View itemView) {
        mShare = (Button) itemView.findViewById(R.id.share);
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
        return R.layout.trtcmeeting_fragment_share_setting;
    }

    public interface OnShareButtonClickListener {
        void onClick();
    }
}
