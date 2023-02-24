package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.model.utils.CommonUtils;
import com.tencent.cloud.tuikit.roomkit.view.component.RaiseHandApplicationListView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RaiseHandApplicationListViewModel implements RoomEventCenter.RoomEngineEventResponder,
        RoomEventCenter.RoomKitUIEventResponder {
    private static final String TAG = "ApplyListViewModel";

    private final RoomStore                    mRoomStore;
    private final TUIRoomEngine                mRoomEngine;
    private final RaiseHandApplicationListView mApplyView;

    private List<UserModel>                    mApplyUserList;
    private Map<String, TUIRoomDefine.Request> mApplyMap;

    public RaiseHandApplicationListViewModel(Context context, RaiseHandApplicationListView view) {
        mApplyView = view;
        mRoomEngine = RoomEngineManager.sharedInstance(context).getRoomEngine();
        mRoomStore = RoomEngineManager.sharedInstance(context).getRoomStore();

        mApplyUserList = new ArrayList<>();
        mApplyMap = new HashMap<>();

        subscribeEvent();
    }

    private void subscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_RECEIVED, this);
        eventCenter.subscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_CANCELLED, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.AGREE_TAKE_SEAT, this);
        eventCenter.subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.DISAGREE_TAKE_SEAT, this);
    }

    public void destroy() {
        unSubscribeEvent();
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_RECEIVED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.REQUEST_CANCELLED, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.AGREE_TAKE_SEAT, this);
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.DISAGREE_TAKE_SEAT, this);
    }

    private void addApplyUser(TUIRoomDefine.Request request) {
        if (mApplyMap.containsKey(request.userId)) {
            return;
        }

        mApplyMap.put(request.userId, request);
        getUserModel(request.userId);
    }

    private UserModel findUserModelById(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return null;
        }
        for (UserModel entity : mApplyUserList) {
            if (entity == null) {
                continue;
            }
            if (userId.equals(entity.userId)) {
                return entity;
            }
        }
        return null;
    }

    public void horizontalAnimation(boolean isShowingView) {
        CommonUtils.horizontalAnimation(mApplyView, isShowingView);
    }

    public List<UserModel> getApplyList() {
        return mApplyUserList;
    }

    public List<UserModel> searchUserByName(String userName) {
        List<UserModel> searchList = new ArrayList<>();
        UserModel userModel = findUserModelByName(userName);
        if (userModel == null) {
            return null;
        }
        searchList.add(userModel);
        return searchList;
    }

    private UserModel findUserModelByName(String userName) {
        if (TextUtils.isEmpty(userName)) {
            return null;
        }
        for (UserModel model : mApplyUserList) {
            if (model == null) {
                continue;
            }
            if (userName.equals(model.userName)) {
                return model;
            }
        }
        return null;
    }

    private void removeApplyUser(String userId) {
        if (mApplyMap.remove(userId) == null) {
            return;
        }
        UserModel userModel = findUserModelById(userId);
        if (userModel == null) {
            return;
        }
        mApplyUserList.remove(userModel);
        mApplyView.removeItem(userModel);
    }

    public void agreeAllUserOnStage() {
        for (UserModel model : mApplyUserList) {
            responseUserOnStage(model.userId, true);
        }
    }

    private void responseUserOnStage(String userId, boolean agree) {
        if (!mApplyMap.containsKey(userId)) {
            return;
        }
        if (mApplyMap.get(userId) == null) {
            return;
        }
        mRoomEngine.responseRemoteRequest(mApplyMap.get(userId).requestId, agree, null);
        removeApplyUser(userId);
    }

    public void inviteMemberOnstage() {
        RoomEventCenter.getInstance().notifyUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_USER_LIST, null);
    }

    private void getUserModel(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        mRoomEngine.getUserInfo(userId, new TUIRoomDefine.GetUserInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                UserModel userModel = new UserModel();
                userModel.userName = TextUtils.isEmpty(userInfo.userName) ? userInfo.userId : userInfo.userName;
                userModel.userAvatar = userInfo.avatarUrl;
                userModel.userId = userInfo.userId;
                mApplyUserList.add(userModel);
                mApplyView.addItem(userModel);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {
                Log.i(TAG, "getUserInfo error,code:" + error + ",msg:" + s);
            }
        });
    }

    private boolean isOwner() {
        return TUIRoomDefine.Role.ROOM_OWNER.equals(mRoomStore.userModel.role);
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        switch (event) {
            case REQUEST_RECEIVED:
                onRequestReceived(params);
                break;
            case REQUEST_CANCELLED:
                onRequestCancelled(params);
                break;
            default:
                break;
        }
    }

    private void onRequestReceived(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        TUIRoomDefine.Request request = (TUIRoomDefine.Request) params.get(RoomEventConstant.KEY_REQUEST);
        if (request == null) {
            return;
        }
        if (isOwner() && request.userId.equals(mRoomStore.userModel.userId)) {
            mRoomEngine.responseRemoteRequest(request.requestId, true, null);
        }
        if (TUIRoomDefine.RequestAction.REQUEST_TO_TAKE_SEAT.equals(request.requestAction)) {
            addApplyUser(request);
        }
    }

    private void onRequestCancelled(Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        if (!mApplyMap.containsKey(userId)) {
            return;
        }
        removeApplyUser(userId);
    }

    @Override
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        if (params == null) {
            return;
        }
        String userId = (String) params.get(RoomEventConstant.KEY_USER_ID);
        if (TextUtils.isEmpty(userId)) {
            return;
        }
        switch (key) {
            case RoomEventCenter.RoomKitUIEvent.AGREE_TAKE_SEAT:
                responseUserOnStage(userId, true);
                break;
            case RoomEventCenter.RoomKitUIEvent.DISAGREE_TAKE_SEAT:
                responseUserOnStage(userId, false);
                break;
            default:
                break;
        }
    }
}
