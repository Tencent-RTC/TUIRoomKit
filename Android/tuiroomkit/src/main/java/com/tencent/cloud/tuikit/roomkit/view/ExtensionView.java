package com.tencent.cloud.tuikit.roomkit.view;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.fragment.app.Fragment;

import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.view.base.BaseTabSettingDialogFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.AudioSettingFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.ShareSettingFragment;
import com.tencent.cloud.tuikit.roomkit.view.extension.VideoSettingFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ExtensionView extends BaseTabSettingDialogFragment {
    private String[]                      mTitleList;
    private VideoSettingFragment          mVideoSettingFragment;
    private AudioSettingFragment          mAudioSettingFragment;
    private ShareSettingFragment          mShareSettingFragment;
    private List<Fragment>                mFragmentList;
    private OnExtensionItemChangeListener mListener;

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
    }

    private void initFragment() {
        if (mFragmentList == null) {
            mFragmentList = new ArrayList<>();
            mVideoSettingFragment = new VideoSettingFragment();
            mVideoSettingFragment.setListener(new VideoSettingFragment.OnItemChangeListener() {
                @Override
                public void onVideoBitrateChange(int bitrate) {
                    if (mListener != null) {
                        mListener.onVideoBitrateChange(bitrate);
                    }
                }

                @Override
                public void onVideoResolutionChange(int resolution) {
                    if (mListener != null) {
                        mListener.onVideoResolutionChange(resolution);
                    }
                }

                @Override
                public void onVideoFpsChange(int fps) {
                    if (mListener != null) {
                        mListener.onVideoFpsChange(fps);
                    }
                }

                @Override
                public void onVideoMirrorChange(boolean mirror) {
                    if (mListener != null) {
                        mListener.onVideoMirrorChange(mirror);
                    }
                }
            });
            mAudioSettingFragment = new AudioSettingFragment();
            mAudioSettingFragment.setListener(new AudioSettingFragment.OnItemChangeListener() {
                @Override
                public void onAudioCaptureVolumeChange(int volume) {
                    if (mListener != null) {
                        mListener.onAudioCaptureVolumeChange(volume);
                    }
                }

                @Override
                public void onAudioPlayVolumeChange(int volume) {
                    if (mListener != null) {
                        mListener.onAudioPlayVolumeChange(volume);
                    }
                }

                @Override
                public void onAudioEvaluationEnableChange(boolean enable) {
                    if (mListener != null) {
                        mListener.onAudioEvaluationEnableChange(enable);
                    }
                }

                @Override
                public void onStartFileDumping(String path) {
                    if (mListener != null) {
                        mListener.onStartFileDumping(path);
                    }
                }

                @Override
                public void onStopFileDumping() {
                    if (mListener != null) {
                        mListener.onStopFileDumping();
                    }
                }
            });
            mShareSettingFragment = new ShareSettingFragment();
            mFragmentList.add(mVideoSettingFragment);
            mFragmentList.add(mAudioSettingFragment);
            mFragmentList.add(mShareSettingFragment);
            mShareSettingFragment.setShareButtonClickListener(new ShareSettingFragment.OnShareButtonClickListener() {
                @Override
                public void onClick() {
                    if (mListener != null) {
                        mListener.onStartScreenShareClick();
                    }
                    dismiss();
                }
            });
            mShareSettingFragment.enableShareButton(mEnableShare);
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

    public int getHeight(DisplayMetrics dm) {
        return (int) (dm.heightPixels * 0.5);
    }

    public int getWidth(DisplayMetrics dm) {
        return WindowManager.LayoutParams.MATCH_PARENT;
    }

    public void setFeatureItemChangeListener(OnExtensionItemChangeListener listener) {
        mListener = listener;
    }

    public void enableShareButton(boolean enable) {
        mEnableShare = enable;
        if (mShareSettingFragment != null) {
            mShareSettingFragment.enableShareButton(enable);
        }
    }

    public interface OnExtensionItemChangeListener {
        void onStartScreenShareClick();

        void onAudioCaptureVolumeChange(int volume);

        void onAudioPlayVolumeChange(int volume);

        void onAudioEvaluationEnableChange(boolean enable);

        void onStartFileDumping(String path);

        void onStopFileDumping();

        void onVideoBitrateChange(int bitrate);

        void onVideoResolutionChange(int resolution);

        void onVideoFpsChange(int fps);

        void onVideoMirrorChange(boolean mirror);
    }
}
