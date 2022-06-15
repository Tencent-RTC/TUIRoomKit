package com.tencent.liteav.tuiroom.ui.widget.feature;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.util.TypedValue;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.blankj.utilcode.util.SizeUtils;
import com.blankj.utilcode.util.ToastUtils;
import com.tencent.liteav.tuiroom.ui.widget.base.BaseSettingFragment;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.BaseSettingItem;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.SeekBarSettingItem;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.SwitchSettingItem;
import com.tencent.liteav.tuiroom.R;
import com.tencent.trtc.TRTCCloudDef;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class AudioSettingFragment extends BaseSettingFragment {
    private LinearLayout          mContentItem;
    private List<BaseSettingItem> mSettingItemList;
    private SwitchSettingItem     mAudioVolumeEvaluationItem;
    private SwitchSettingItem     mRecordItem;
    private FeatureConfig         mFeatureConfig;
    private String                mRecordFilePath;
    private SeekBarSettingItem    mCollectionVolumeItem;
    private SeekBarSettingItem    mPlayVolumeItem;

    @Override
    protected void initView(View itemView) {
        mContentItem = (LinearLayout) itemView.findViewById(R.id.item_content);
        mSettingItemList = new ArrayList<>();
        mFeatureConfig = FeatureConfig.getInstance();
        mRecordFilePath = getRecordFilePath();

        BaseSettingItem.ItemText itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_collection_volume), "");

        mCollectionVolumeItem = new SeekBarSettingItem(getContext(), itemText, new SeekBarSettingItem.Listener() {
            @Override
            public void onSeekBarChange(int progress, boolean fromUser) {
                String volume = String.valueOf(progress);
                mCollectionVolumeItem.setTips(volume);
                mFeatureConfig.setMicVolume(progress);
                mTUIRoomCore.setAudioCaptureVolume(progress);
            }
        }).setProgress(mFeatureConfig.getMicVolume());
        mSettingItemList.add(mCollectionVolumeItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_play_volume), "");
        mPlayVolumeItem = new SeekBarSettingItem(getContext(), itemText, new SeekBarSettingItem.Listener() {
            @Override
            public void onSeekBarChange(int progress, boolean fromUser) {
                String volume = String.valueOf(progress);
                mPlayVolumeItem.setTips(volume);
                mFeatureConfig.setPlayoutVolume(progress);
                mTUIRoomCore.setAudioPlayVolume(progress);
            }
        }).setProgress(mFeatureConfig.getPlayoutVolume());
        mSettingItemList.add(mPlayVolumeItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_volume_reminder), "");
        mAudioVolumeEvaluationItem = new SwitchSettingItem(getContext(), itemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                mFeatureConfig.setAudioVolumeEvaluation(isChecked);
                mTUIRoomCore.enableAudioEvaluation(isChecked);
                Intent intent = new Intent(FeatureConfig.AUDIO_EVALUATION_CHANGED);
                LocalBroadcastManager.getInstance(getActivity()).sendBroadcast(intent);

            }
        }).setCheck(mFeatureConfig.isAudioVolumeEvaluation());
        mSettingItemList.add(mAudioVolumeEvaluationItem);

        itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_audio_recording), "");
        mRecordItem = new SwitchSettingItem(getContext(), itemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                if (isChecked) {
                    if (!mFeatureConfig.isRecording()) {
                        mFeatureConfig.setRecording(true);
                        createFile(mRecordFilePath);
                        TRTCCloudDef.TRTCAudioRecordingParams params = new TRTCCloudDef.TRTCAudioRecordingParams();
                        params.filePath = mRecordFilePath;
                        mTUIRoomCore.startFileDumping(params);
                        ToastUtils.showShort(getString(R.string.tuiroom_btn_start_recording));
                    }
                } else {
                    if (mFeatureConfig.isRecording()) {
                        mTUIRoomCore.stopFileDumping();
                        mFeatureConfig.setRecording(false);
                        ToastUtils.showLong(getString(R.string.tuiroom_toast_recording_file_path_copied,
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
        }).setCheck(mFeatureConfig.isRecording());
        mSettingItemList.add(mRecordItem);
        updateItem();

        for (BaseSettingItem item : mSettingItemList) {
            View view = item.getView();
            view.setPadding(0, SizeUtils.dp2px(12), 0, SizeUtils.dp2px(12));
            mContentItem.addView(view);
        }
    }

    private List<View> createAudioRecordButton() {
        final TextView button = new TextView(getContext());
        if (!mFeatureConfig.isRecording()) {
            button.setText(getString(R.string.tuiroom_btn_start_recording));
        } else {
            button.setText(getString(R.string.tuiroom_btn_stop_recording));
        }
        button.setPadding(SizeUtils.dp2px(12), SizeUtils.dp2px(4), SizeUtils.dp2px(12),
                SizeUtils.dp2px(4));
        button.setBackgroundResource(R.drawable.tuiroom_btn_border);
        button.setTextColor(getResources().getColor(R.color.tuiroom_color_white));

        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!mFeatureConfig.isRecording()) {
                    mFeatureConfig.setRecording(true);
                    createFile(mRecordFilePath);
                    TRTCCloudDef.TRTCAudioRecordingParams params = new TRTCCloudDef.TRTCAudioRecordingParams();
                    params.filePath = mRecordFilePath;
                    mTUIRoomCore.startFileDumping(params);
                    button.setText(getString(R.string.tuiroom_btn_end_recording));
                } else {
                    mTUIRoomCore.stopFileDumping();
                    mFeatureConfig.setRecording(false);
                    button.setText(getString(R.string.tuiroom_btn_start_recording));
                    ToastUtils.showLong(getString(R.string.tuiroom_toast_recording_file_path_copied, mRecordFilePath));
                    ClipboardManager cm = (ClipboardManager) getActivity().getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData mClipData = ClipData.newPlainText("path", mRecordFilePath);
                    if (cm != null) {
                        cm.setPrimaryClip(mClipData);
                    }
                }
            }
        });
        List<View> views = new ArrayList<>();
        views.add(button);
        return views;
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

    @Override
    protected int getLayoutId() {
        return R.layout.tuiroom_fragment_common_setting;
    }
}
