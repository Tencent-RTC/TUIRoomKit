package com.tencent.liteav.demo.viewmodel;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.BaseSettingItem;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.SwitchSettingItem;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.util.ArrayList;

public class EnterRoomViewModel {
    private Context mContext;

    private boolean mIsOpenCamera     = true;
    private boolean mIsOpenMicrophone = true;
    private boolean mIsUseSpeaker     = true;

    public EnterRoomViewModel(Context context) {
        mContext = context;
    }

    public void enterRoom(String roomId) {
        if (TextUtils.isEmpty(roomId)) {
            return;
        }
        TUIRoomKit tuiRoomKit = TUIRoomKit.createInstance();
        tuiRoomKit.enterRoom(roomId, mIsOpenMicrophone, mIsOpenCamera, mIsUseSpeaker,
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
                .ItemText(mContext.getString(R.string.tuiroomkit_turn_on_microphone), "");
        SwitchSettingItem audioItem = new SwitchSettingItem(mContext, audioItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsOpenMicrophone = isChecked;
                    }
                }).setCheck(mIsOpenMicrophone);
        ArrayList<SwitchSettingItem> settingItemList = new ArrayList<>();
        settingItemList.add(audioItem);

        BaseSettingItem.ItemText speakerItemText = new BaseSettingItem
                .ItemText(mContext.getString(R.string.tuiroomkit_turn_on_speaker), "");
        SwitchSettingItem speakerItem = new SwitchSettingItem(mContext, speakerItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsUseSpeaker = isChecked;
                    }
                }).setCheck(mIsUseSpeaker);
        settingItemList.add(speakerItem);

        BaseSettingItem.ItemText videoItemText =
                new BaseSettingItem.ItemText(mContext.getString(R.string.tuiroomkit_turn_on_camera), "");
        SwitchSettingItem videoItem = new SwitchSettingItem(mContext, videoItemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsOpenCamera = isChecked;
                    }
                }).setCheck(mIsOpenCamera);
        settingItemList.add(videoItem);
        return settingItemList;
    }
}
