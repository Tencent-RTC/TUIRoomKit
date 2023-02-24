package com.tencent.cloud.tuikit.roomkit.view.component;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.fragment.app.Fragment;

import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.viewmodel.SettingViewModel;
import com.tencent.cloud.tuikit.roomkit.view.base.BaseTabSettingDialogFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.AudioSettingFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.ShareSettingFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.VideoSettingFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class SettingView extends BaseTabSettingDialogFragment {
    private String[]             mTitleList;
    private VideoSettingFragment mVideoSettingFragment;
    private AudioSettingFragment mAudioSettingFragment;
    private ShareSettingFragment mShareSettingFragment;
    private List<Fragment>       mFragmentList;
    private SettingViewModel     mViewModel;

    private boolean mEnableShare = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mTitleList = new String[]{
                getString(R.string.tuiroomkit_title_video),
                getString(R.string.tuiroomkit_title_audio),
                getString(R.string.tuiroomkit_title_sharing)
        };
        initFragment();
        mViewModel = new SettingViewModel(getContext(), this);
    }

    private void initFragment() {
        if (mFragmentList == null) {
            mFragmentList = new ArrayList<>();
            mVideoSettingFragment = new VideoSettingFragment();
            mVideoSettingFragment.setListener(new VideoSettingFragment.OnItemChangeListener() {
                @Override
                public void onVideoBitrateChange(int bitrate) {
                    mViewModel.setVideoBitrate(bitrate);
                }

                @Override
                public void onVideoResolutionChange(int resolution) {
                    mViewModel.setVideoResolution(resolution);
                }

                @Override
                public void onVideoFpsChange(int fps) {
                    mViewModel.setVideoFps(fps);
                }

                @Override
                public void onVideoMirrorChange(boolean mirror) {
                    mViewModel.setVideoMirror(mirror);
                }
            });
            mAudioSettingFragment = new AudioSettingFragment();
            mAudioSettingFragment.setListener(new AudioSettingFragment.OnItemChangeListener() {
                @Override
                public void onAudioCaptureVolumeChange(int volume) {
                    mViewModel.setAudioCaptureVolume(volume);
                }

                @Override
                public void onAudioPlayVolumeChange(int volume) {
                    mViewModel.setAudioPlayVolume(volume);
                }

                @Override
                public void onAudioEvaluationEnableChange(boolean enable) {
                    mViewModel.enableAudioEvaluation(enable);
                }

                @Override
                public void onStartFileDumping(String path) {
                    mViewModel.startFileDumping(path);
                }

                @Override
                public void onStopFileDumping() {
                    mViewModel.stopFileDumping();
                }
            });
            mShareSettingFragment = new ShareSettingFragment();
            mFragmentList.add(mVideoSettingFragment);
            mFragmentList.add(mAudioSettingFragment);
            mFragmentList.add(mShareSettingFragment);
            mShareSettingFragment.setShareButtonClickListener(new ShareSettingFragment.OnShareButtonClickListener() {
                @Override
                public void onClick() {
                    mViewModel.startScreenShare();
                    dismiss();
                }
            });
            mShareSettingFragment.enableShareButton(mEnableShare);
        }
    }

    @Override
    public void onDestroy() {
        mViewModel.destroy();
        super.onDestroy();
    }

    @Override
    protected List<Fragment> getFragments() {
        return mFragmentList;
    }

    @Override
    protected List<String> getTitleList() {
        return Arrays.asList(mTitleList);
    }

    public void enableShareButton(boolean enable) {
        mEnableShare = enable;
        if (mShareSettingFragment != null) {
            mShareSettingFragment.enableShareButton(enable);
        }
    }
}
