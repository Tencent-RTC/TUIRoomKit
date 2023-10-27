package com.tencent.liteav.demo.viewmodel;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.BaseSettingItem;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.SwitchSettingItem;
import com.tencent.liteav.demo.R;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.ArrayList;

public class EnterRoomViewModel {
    private Context mContext;

    private boolean mIsOpenVideo  = true;
    private boolean mIsOpenAudio  = true;
    private boolean mIsUseSpeaker = true;

    public EnterRoomViewModel(Context context) {
        mContext = context;
    }

    public void enterRoom(String roomId) {
        if (TextUtils.isEmpty(roomId)) {
            return;
        }
        TUIRoomKit tuiRoomKit = TUIRoomKit.createInstance();
        tuiRoomKit.enterRoom(roomId, mIsOpenAudio, mIsOpenVideo, mIsUseSpeaker,
                new TUIRoomDefine.GetRoomInfoCallback() {
                    @Override
                    public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String message) {
                        ToastUtil.toastLongMessage("error=" + error + " message=" + message);
                    }
                });
    }

    public ArrayList<SwitchSettingItem> createSwitchSettingItemList() {
        BaseSettingItem.ItemText audioItemText = new BaseSettingItem
                .ItemText(mContext.getString(R.string.app_turn_on_audio), "");
        SwitchSettingItem audioItem = new SwitchSettingItem(mContext, audioItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsOpenAudio = isChecked;
                    }
                }).setCheck(mIsOpenAudio);
        ArrayList<SwitchSettingItem> settingItemList = new ArrayList<>();
        settingItemList.add(audioItem);

        BaseSettingItem.ItemText speakerItemText = new BaseSettingItem
                .ItemText(mContext.getString(R.string.app_turn_on_speaker), "");
        SwitchSettingItem speakerItem = new SwitchSettingItem(mContext, speakerItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsUseSpeaker = isChecked;
                    }
                }).setCheck(mIsUseSpeaker);
        settingItemList.add(speakerItem);

        BaseSettingItem.ItemText videoItemText =
                new BaseSettingItem.ItemText(mContext.getString(R.string.app_turn_on_video), "");
        SwitchSettingItem videoItem = new SwitchSettingItem(mContext, videoItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsOpenVideo = isChecked;
                    }
                }).setCheck(mIsOpenVideo);
        settingItemList.add(videoItem);
        return settingItemList;
    }
}
