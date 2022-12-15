package com.tencent.cloud.tuikit.roomkit.view.extension;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.tencent.cloud.tuikit.roomkit.R;


public class ShareSettingFragment extends Fragment {

    private Button  mShare;
    private boolean mEnableShare = true;

    private OnShareButtonClickListener mListener;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.tuiroomkit_fragment_share_setting, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView(view);
    }

    private void initView(View itemView) {
        mShare = itemView.findViewById(R.id.share);
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
