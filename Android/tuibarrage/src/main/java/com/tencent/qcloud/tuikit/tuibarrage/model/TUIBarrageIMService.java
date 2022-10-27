package com.tencent.qcloud.tuikit.tuibarrage.model;

import android.text.TextUtils;
import android.util.Log;

import com.google.gson.Gson;
import com.tencent.imsdk.v2.V2TIMGroupMemberInfo;
import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.imsdk.v2.V2TIMMessage;
import com.tencent.imsdk.v2.V2TIMMessageManager;
import com.tencent.imsdk.v2.V2TIMSimpleMsgListener;
import com.tencent.imsdk.v2.V2TIMValueCallback;
import com.tencent.qcloud.tuikit.tuibarrage.presenter.ITUIBarragePresenter;
import com.tencent.qcloud.tuikit.tuibarrage.presenter.TUIBarrageCallBack;

import java.util.HashMap;

/**
 * IM服务类,调用IM SDK接口进行弹幕消息的发送和接收
 * sendBarrage              发送弹幕信息
 * onRecvGroupCustomMessage 接收弹幕信息
 */
public class TUIBarrageIMService {
    private static final String TAG = "TUIBarrageIMService";

    private SimpleListener       mSimpleListener;
    private ITUIBarragePresenter mPresenter;
    private String               mGroupId;

    public TUIBarrageIMService(ITUIBarragePresenter presenter) {
        initIMListener();
        mPresenter = presenter;
    }

    public void setGroupId(String groupId) {
        mGroupId = groupId;
    }

    //初始化IM监听
    private void initIMListener() {
        V2TIMMessageManager messageManager = V2TIMManager.getMessageManager();
        if (mSimpleListener == null) {
            mSimpleListener = new SimpleListener();
        }
        V2TIMManager.getInstance().addSimpleMsgListener(mSimpleListener);
    }

    public void unInitImListener() {
        V2TIMManager.getInstance().setGroupListener(null);
        V2TIMManager.getInstance().removeSimpleMsgListener(mSimpleListener);
    }

    public void sendBarrage(TUIBarrageModel model, final TUIBarrageCallBack.ActionCallback callback) {
        if (TextUtils.isEmpty(model.message)) {
            Log.d(TAG, "sendBarrage data is empty");
            return;
        }
        Log.d(TAG, "sendBarrage: data = " + model.message + " , mGroupId = " + mGroupId);
        V2TIMManager.getInstance().sendGroupTextMessage(model.message, mGroupId, V2TIMMessage.V2TIM_PRIORITY_HIGH,
                new V2TIMValueCallback<V2TIMMessage>() {
                    @Override
                    public void onSuccess(V2TIMMessage v2TIMMessage) {
                        if (callback != null) {
                            callback.onCallback(0, "send group message success.");
                            Log.e(TAG, "sendGroupCustomMessage success");
                        }
                    }

                    @Override
                    public void onError(int i, String s) {
                        Log.e(TAG, "sendGroupCustomMessage error " + i + " errorMessage:" + s);
                        if (callback != null) {
                            callback.onCallback(i, s);
                        }
                    }
                });
    }

    private class SimpleListener extends V2TIMSimpleMsgListener {
        @Override
        public void onRecvGroupTextMessage(String msgID, String groupID, V2TIMGroupMemberInfo sender, String text) {
            Log.d(TAG, "onRecvGroupCustomMessage: msgID = " + msgID + " , groupID = " + groupID
                    + " , mGroupId = " + mGroupId + " , sender = " + sender + " , text = " + text);
            if (groupID == null || !groupID.equals(mGroupId)) {
                return;
            }
            if (TextUtils.isEmpty(text)) {
                Log.d(TAG, "onRecvGroupCustomMessage customData is empty");
                return;
            }
            HashMap<String, String> userMap = new HashMap<>();
            userMap.put(TUIBarrageConstants.KEY_USER_ID, sender.getUserID());
            userMap.put(TUIBarrageConstants.KEY_USER_NAME, sender.getNickName());
            userMap.put(TUIBarrageConstants.KEY_USER_AVATAR, sender.getFaceUrl());
            TUIBarrageModel model = new TUIBarrageModel();
            model.message = text;
            model.extInfo = userMap;

            if (mPresenter != null) {
                mPresenter.receiveBarrage(model);
            }
        }
    }

    //自定义弹幕发送数据
    public static String getTextMsgJsonStr(TUIBarrageModel model) {
        if (model == null) {
            return null;
        }
        TUIBarrageJson sendJson = new TUIBarrageJson();
        sendJson.setBusinessID(TUIBarrageConstants.VALUE_BUSINESS_ID);
        sendJson.setPlatform(TUIBarrageConstants.VALUE_PLATFORM);
        sendJson.setVersion(TUIBarrageConstants.VALUE_VERSION);

        TUIBarrageJson.Data data = new TUIBarrageJson.Data();
        data.setMessage(model.message);

        //扩展信息
        TUIBarrageJson.Data.ExtInfo extInfo = new TUIBarrageJson.Data.ExtInfo();
        extInfo.setUserID(model.extInfo.get(TUIBarrageConstants.KEY_USER_ID));
        extInfo.setNickName(model.extInfo.get(TUIBarrageConstants.KEY_USER_NAME));
        extInfo.setAvatarUrl(model.extInfo.get(TUIBarrageConstants.KEY_USER_AVATAR));

        data.setExtInfo(extInfo);
        sendJson.setData(data);

        Gson gson = new Gson();
        return gson.toJson(sendJson);
    }
}
