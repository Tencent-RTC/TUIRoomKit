package com.tencent.liteav.demo.viewmodel;

import static com.tencent.imsdk.BaseConstants.ERR_SUCC;

import android.content.Context;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;
import com.tencent.imsdk.v2.V2TIMGroupInfoResult;
import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.imsdk.v2.V2TIMValueCallback;
import com.tencent.liteav.demo.R;
import com.tencent.liteav.demo.view.component.BaseSettingItem;
import com.tencent.liteav.demo.view.component.SwitchSettingItem;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CreateRoomViewModel {
    private static final String TAG = "CreateRoomViewModel";

    private Context mContext;

    private boolean mIsOpenVideo  = true;
    private boolean mIsOpenAudio  = true;
    private boolean mIsUseSpeaker = true;

    private boolean mIsSeatEnabled;

    public CreateRoomViewModel(Context context) {
        mContext = context;
    }

    public void setSeatEnable(boolean enable) {
        mIsSeatEnabled = enable;
    }

    public void createRoom(String roomId) {
        TUIRoomDefine.RoomInfo roomInfo = new TUIRoomDefine.RoomInfo();
        roomInfo.roomId = roomId;
        roomInfo.name = truncateString(TUILogin.getNickName());
        roomInfo.isSeatEnabled = mIsSeatEnabled;
        roomInfo.seatMode = TUIRoomDefine.SeatMode.APPLY_TO_TAKE;
        TUIRoomKit roomKit = TUIRoomKit.createInstance();
        roomKit.createRoom(roomInfo, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                roomKit.enterRoom(roomId, mIsOpenAudio, mIsOpenVideo, mIsUseSpeaker,
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

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                ToastUtil.toastLongMessage("error=" + error + " message=" + message);
            }
        });
    }

    private String truncateString(String string) {
        int length = string.getBytes(StandardCharsets.UTF_8).length;
        if (length <= 30) {
            return string;
        } else {
            int byteLen = 0;
            StringBuilder result = new StringBuilder();
            for (char c : string.toCharArray()) {
                byteLen += String.valueOf(c).getBytes(StandardCharsets.UTF_8).length;
                if (byteLen > 30) {
                    break;
                }
                result.append(c);
            }
            return result.toString();
        }
    }

    public ArrayList<SwitchSettingItem> createSwitchSettingItemList() {
        BaseSettingItem.ItemText audioItemText =
                new BaseSettingItem.ItemText(mContext.getString(R.string.app_turn_on_audio), "");
        SwitchSettingItem audioItem = new SwitchSettingItem(mContext, audioItemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                mIsOpenAudio = isChecked;
            }
        }).setCheck(mIsOpenAudio);
        ArrayList<SwitchSettingItem> settingItemList = new ArrayList<>();
        settingItemList.add(audioItem);

        BaseSettingItem.ItemText speakerItemText =
                new BaseSettingItem.ItemText(mContext.getString(R.string.app_turn_on_speaker), "");
        SwitchSettingItem speakerItem =
                new SwitchSettingItem(mContext, speakerItemText, new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mIsUseSpeaker = isChecked;
                    }
                }).setCheck(mIsUseSpeaker);
        settingItemList.add(speakerItem);

        BaseSettingItem.ItemText videoItemText =
                new BaseSettingItem.ItemText(mContext.getString(R.string.app_turn_on_video), "");
        SwitchSettingItem videoItem = new SwitchSettingItem(mContext, videoItemText, new SwitchSettingItem.Listener() {
            @Override
            public void onSwitchChecked(boolean isChecked) {
                mIsOpenVideo = isChecked;
            }
        }).setCheck(mIsOpenVideo);
        settingItemList.add(videoItem);
        return settingItemList;
    }
}
