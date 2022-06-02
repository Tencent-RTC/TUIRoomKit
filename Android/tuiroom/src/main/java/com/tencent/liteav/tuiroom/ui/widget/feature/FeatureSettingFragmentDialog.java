package com.tencent.liteav.tuiroom.ui.widget.feature;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.fragment.app.Fragment;

import com.tencent.liteav.tuiroom.model.TUIRoomCore;
import com.tencent.liteav.tuiroom.ui.widget.base.BaseSettingFragment;
import com.tencent.liteav.tuiroom.ui.widget.base.BaseTabSettingFragmentDialog;
import com.tencent.liteav.tuiroom.R;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class FeatureSettingFragmentDialog extends BaseTabSettingFragmentDialog {
    private String[]                   mTitleList;
    private VideoSettingFragment       mVideoSettingFragment;
    private AudioSettingFragment       mAudioSettingFragment;
    private ShareSettingFragment       mShareSettingFragment;
    private List<Fragment>             mFragmentList;
    private TUIRoomCore                mTUIRoomCore;
    private OnShareButtonClickListener mListener;

    private boolean mEnableShare = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mTitleList = new String[]{
                getString(R.string.tuiroom_title_video),
                getString(R.string.tuiroom_title_audio),
                getString(R.string.tuiroom_title_sharing)
        };
        initFragment();
    }

    private void initFragment() {
        if (mFragmentList == null) {
            mFragmentList = new ArrayList<>();
            mVideoSettingFragment = new VideoSettingFragment();
            mAudioSettingFragment = new AudioSettingFragment();
            mShareSettingFragment = new ShareSettingFragment();
            mFragmentList.add(mVideoSettingFragment);
            mFragmentList.add(mAudioSettingFragment);
            mFragmentList.add(mShareSettingFragment);
            if (mTUIRoomCore != null) {
                for (Fragment fragment : mFragmentList) {
                    if (fragment instanceof BaseSettingFragment) {
                        ((BaseSettingFragment) fragment).setTRTCRoomCore(mTUIRoomCore);
                    }
                }
            }
            mShareSettingFragment.setShareButtonClickListener(new ShareSettingFragment.OnShareButtonClickListener() {
                @Override
                public void onClick() {
                    if (mListener != null) {
                        mListener.onClick();
                    }
                    dismiss();
                }
            });
            mShareSettingFragment.enableShareButton(mEnableShare);
        }
    }

    public void setTUIRoomCore(TUIRoomCore tUIRoomCore) {
        mTUIRoomCore = tUIRoomCore;
        if (mFragmentList != null && mFragmentList.size() != 0) {
            for (Fragment fragment : mFragmentList) {
                if (fragment instanceof BaseSettingFragment) {
                    ((BaseSettingFragment) fragment).setTRTCRoomCore(mTUIRoomCore);
                }
            }
        }
    }

    @Override
    protected List<Fragment> getFragments() {
        return mFragmentList;
    }

    @Override
    protected List<String> getTitleList() {
        return Arrays.asList(mTitleList);
    }

    @Override
    protected int getHeight(DisplayMetrics dm) {
        return (int) (dm.heightPixels * 0.5);
    }

    @Override
    protected int getWidth(DisplayMetrics dm) {
        return WindowManager.LayoutParams.MATCH_PARENT;
    }

    public void setShareButtonClickListener(OnShareButtonClickListener listener) {
        mListener = listener;
    }

    public void enableShareButton(boolean enable) {
        mEnableShare = enable;
        if (mShareSettingFragment != null) {
            mShareSettingFragment.enableShareButton(enable);
        }
    }

    public interface OnShareButtonClickListener {
        void onClick();
    }
}
