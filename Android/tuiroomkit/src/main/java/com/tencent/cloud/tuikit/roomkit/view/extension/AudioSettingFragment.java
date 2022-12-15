package com.tencent.cloud.tuikit.roomkit.view.extension;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.ExtensionSettingEntity;
import com.tencent.cloud.tuikit.roomkit.model.manager.ExtensionSettingManager;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.BaseSettingItem;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.SeekBarSettingItem;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.SwitchSettingItem;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class AudioSettingFragment extends Fragment {
    public static final String AUDIO_EVALUATION_CHANGED = "AUDIO_EVALUATION_CHANGED";

    private String                  mRecordFilePath;
    private LinearLayout            mContentItem;
    private SwitchSettingItem       mAudioVolumeEvaluationItem;
    private SwitchSettingItem       mRecordItem;
    private SeekBarSettingItem      mCollectionVolumeItem;
    private SeekBarSettingItem      mPlayVolumeItem;
    private List<BaseSettingItem>   mSettingItemList;
    private OnItemChangeListener    mListener;
    private ExtensionSettingManager mExtensionSettingManager;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(R.layout.tuiroomkit_fragment_common_setting, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView(view);
    }

    protected void initView(View itemView) {
        mContentItem = itemView.findViewById(R.id.item_content);
        mSettingItemList = new ArrayList<>();
        mExtensionSettingManager = ExtensionSettingManager.getInstance();
        mRecordFilePath = getRecordFilePath();

        BaseSettingItem.ItemText itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroomkit_title_collection_volume), "");

        mCollectionVolumeItem = new SeekBarSettingItem(getContext(), itemText, new SeekBarSettingItem.Listener() {
            @Override
            public void onSeekBarChange(int progress, boolean fromUser) {
                String volume = String.valueOf(progress);
                mCollectionVolumeItem.setTips(volume);
                ExtensionSettingEntity entity = mExtensionSettingManager.getExtensionSetting();
                entity.micVolume = progress;
                mExtensionSettingManager.setExtensionSetting(entity);
                if (mListener != null) {
                    mListener.onAudioCaptureVolumeChange(progress);
                }
            }
        }).setProgress(mExtensionSettingManager.getExtensionSetting().micVolume);
        mSettingItemList.add(mCollectionVolumeItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroomkit_title_play_volume), "");
        mPlayVolumeItem = new SeekBarSettingItem(getContext(), itemText, new SeekBarSettingItem.Listener() {
            @Override
            public void onSeekBarChange(int progress, boolean fromUser) {
                String volume = String.valueOf(progress);
                mPlayVolumeItem.setTips(volume);
                ExtensionSettingEntity entity = mExtensionSettingManager.getExtensionSetting();
                entity.playVolume = progress;
                mExtensionSettingManager.setExtensionSetting(entity);
                if (mListener != null) {
                    mListener.onAudioPlayVolumeChange(progress);
                }
            }
        }).setProgress(mExtensionSettingManager.getExtensionSetting().playVolume);
        mSettingItemList.add(mPlayVolumeItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroomkit_title_volume_reminder), "");
        mAudioVolumeEvaluationItem = new SwitchSettingItem(getContext(), itemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                ExtensionSettingEntity entity = mExtensionSettingManager.getExtensionSetting();
                entity.audioVolumeEvaluation = isChecked;
                mExtensionSettingManager.setExtensionSetting(entity);
                if (mListener != null) {
                    mListener.onAudioEvaluationEnableChange(isChecked);
                }
                Intent intent = new Intent(AUDIO_EVALUATION_CHANGED);
                LocalBroadcastManager.getInstance(getActivity()).sendBroadcast(intent);

            }
        }).setCheck(mExtensionSettingManager.getExtensionSetting().audioVolumeEvaluation);
        mSettingItemList.add(mAudioVolumeEvaluationItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroomkit_title_audio_recording), "");
        mRecordItem = new SwitchSettingItem(getContext(), itemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                if (isChecked) {
                    if (!mExtensionSettingManager.getExtensionSetting().recording) {
                        ExtensionSettingEntity entity = mExtensionSettingManager.getExtensionSetting();
                        entity.recording = true;
                        mExtensionSettingManager.setExtensionSetting(entity);
                        createFile(mRecordFilePath);
                        if (mListener != null) {
                            mListener.onStartFileDumping(mRecordFilePath);
                        }
                        ToastUtils.showShort(getString(R.string.tuiroomkit_btn_start_recording));
                    }
                } else {
                    if (mExtensionSettingManager.getExtensionSetting().recording) {
                        if (mListener != null) {
                            mListener.onStopFileDumping();
                        }
                        ExtensionSettingEntity entity = mExtensionSettingManager.getExtensionSetting();
                        entity.recording = false;
                        mExtensionSettingManager.setExtensionSetting(entity);
                        ToastUtils.showLong(getString(R.string.tuiroomkit_toast_recording_file_path_copied,
                                mRecordFilePath));
                        ClipboardManager cm = (ClipboardManager) getActivity().getSystemService(
                                Context.CLIPBOARD_SERVICE);
                        ClipData mClipData = ClipData.newPlainText("path", mRecordFilePath);
                        if (cm != null) {
                            cm.setPrimaryClip(mClipData);
                        }
                    }
                }
            }
        }).setCheck(mExtensionSettingManager.getExtensionSetting().recording);
        mSettingItemList.add(mRecordItem);
        updateItem();

        for (BaseSettingItem item : mSettingItemList) {
            View view = item.getView();
            int paddingVertical = getResources()
                    .getDimensionPixelSize(R.dimen.tuiroomkit_radio_button_padding_vertical);
            view.setPadding(0, paddingVertical, 0, paddingVertical);
            mContentItem.addView(view);
        }
    }

    private String getRecordFilePath() {
        File sdcardDir = getActivity().getExternalFilesDir(null);
        if (sdcardDir == null) {
            return null;
        }

        String dirPath = sdcardDir.getAbsolutePath() + "/test/record/";
        File dir = new File(dirPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        File file = new File(dir, "record.aac");

        return file.getAbsolutePath();
    }

    private void createFile(String path) {
        File file = new File(path);
        try {
            file.delete();
            file.createNewFile();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    private void updateItem() {
    }

    public void setListener(OnItemChangeListener listener) {
        this.mListener = listener;
    }

    public interface OnItemChangeListener {
        void onAudioCaptureVolumeChange(int volume);

        void onAudioPlayVolumeChange(int volume);

        void onAudioEvaluationEnableChange(boolean enable);

        void onStartFileDumping(String path);

        void onStopFileDumping();
    }
}
