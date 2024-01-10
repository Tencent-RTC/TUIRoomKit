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

    public interface GetRoomIdCallback {
        void onGetRoomId(String roomId);
    }

    public CreateRoomViewModel(Context context) {
        mContext = context;
    }

    public void setSeatEnable(boolean enable) {
        mIsSeatEnabled = enable;
    }

    public void getRoomId(GetRoomIdCallback callback) {
        String roomId = generateRandomRoomId(6);
        isRoomIdExisted(roomId, new TUICallback() {
            @Override
            public void onSuccess() {
                getRoomId(callback);
            }

            @Override
            public void onError(int errorCode, String errorMessage) {
                if (callback != null) {
                    callback.onGetRoomId(roomId);
                }
            }
        });
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

    private String generateRandomRoomId(int numberOfDigits) {
        Random random = new Random();
        int minNumber = (int) Math.pow(10, numberOfDigits - 1);
        int maxNumber = (int) Math.pow(10, numberOfDigits) - 1;
        int randomNumber = random.nextInt(maxNumber - minNumber) + minNumber;
        String roomId = randomNumber + "";
        Log.d(TAG, "generateRandomRoomId : " + roomId);
        return roomId;
    }

    private void isRoomIdExisted(String roomId, TUICallback callback) {
        List<String> idList = new ArrayList<>(1);
        idList.add(roomId);
        Log.d(TAG, "getGroupsInfo roomId=" + roomId);
        V2TIMManager.getGroupManager().getGroupsInfo(idList, new V2TIMValueCallback<List<V2TIMGroupInfoResult>>() {
            @Override
            public void onSuccess(List<V2TIMGroupInfoResult> v2TIMGroupInfoResults) {
                Log.d(TAG, "getGroupsInfo onSuccess");
                if (v2TIMGroupInfoResults == null || v2TIMGroupInfoResults.isEmpty()) {
                    callback.onError(0, "result is empty");
                    return;
                }
                if (v2TIMGroupInfoResults.get(0).getResultCode() == ERR_SUCC) {
                    callback.onSuccess();
                    return;
                }
                callback.onError(v2TIMGroupInfoResults.get(0).getResultCode(),
                        v2TIMGroupInfoResults.get(0).getResultMessage());
            }

            @Override
            public void onError(int code, String desc) {
                Log.d(TAG, "getGroupsInfo onError code=" + code + " desc=" + desc);
                callback.onError(code, desc);
            }
        });
    }
}
