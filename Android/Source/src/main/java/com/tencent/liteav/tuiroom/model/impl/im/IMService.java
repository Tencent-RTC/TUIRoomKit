package com.tencent.liteav.tuiroom.model.impl.im;

import android.content.Context;
import android.text.TextUtils;

import com.google.gson.Gson;
import com.tencent.imsdk.v2.V2TIMCallback;
import com.tencent.imsdk.v2.V2TIMGroupChangeInfo;
import com.tencent.imsdk.v2.V2TIMGroupInfo;
import com.tencent.imsdk.v2.V2TIMGroupInfoResult;
import com.tencent.imsdk.v2.V2TIMGroupListener;
import com.tencent.imsdk.v2.V2TIMGroupMemberFullInfo;
import com.tencent.imsdk.v2.V2TIMGroupMemberInfo;
import com.tencent.imsdk.v2.V2TIMGroupMemberInfoResult;
import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.imsdk.v2.V2TIMMessage;
import com.tencent.imsdk.v2.V2TIMSignalingListener;
import com.tencent.imsdk.v2.V2TIMSimpleMsgListener;
import com.tencent.imsdk.v2.V2TIMUserFullInfo;
import com.tencent.imsdk.v2.V2TIMValueCallback;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreCallback;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;
import com.tencent.liteav.tuiroom.model.impl.base.CmdInvitation;
import com.tencent.liteav.tuiroom.model.impl.base.InvitationState;
import com.tencent.liteav.tuiroom.model.impl.base.TRTCLogger;
import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfo;
import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfoCallback;
import com.tencent.liteav.tuiroom.model.impl.base.TXUserInfoListCallback;
import com.tencent.liteav.tuiroom.model.impl.base.GroupNotificationData;
import com.tencent.liteav.tuiroom.model.impl.base.SignalDataUtils;
import com.tencent.liteav.tuiroom.model.impl.base.SignallingConstant;
import com.tencent.liteav.tuiroom.model.impl.base.SignallingData;
import com.tencent.liteav.tuiroom.R;
import com.tencent.qcloud.tuicore.TUILogin;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class IMService {
    private static final String TAG = "TuiIMService";

    /**
     * 超时时间，单位秒
     */
    private static final int    CODE_SUCCESS         = 0;
    private static final int    CODE_ERROR           = -1;
    public static final  int    TIME_OUT_COUNT_LONG  = 30;
    public static final  int    TIME_OUT_COUNT_SHORT = 5;
    private static final String MESSAGE_SUCCESS      = "success";
    private static final String ROOM_ID_HEAD         = "Room_";

    private Context                    mContext;
    private ImServiceListener          mListener;
    private RoomSimpleMsgListener      mSimpleListener;
    private RoomGroupListener          mGroupListener;
    private boolean                    mIsEnterRoom;
    private String                     mRoomId;
    private String                     mRoomName;
    private String                     mSelfUserId;
    private String                     mOwnerUserId;
    private String                     mInviteId;
    private Map<String, CmdInvitation> mInvitationIdMap;
    private Map<String, CmdInvitation> mCmdMap;
    private Map<String, String>        mReceiverInvitationCmdMap;
    private Map<String, String>        mReceiverInvitationIdMap;
    private GroupNotificationData      mGroupNotificationData;
    private List<TXUserInfo>           mUserInfoList;

    public IMService(Context context) {
        mContext = context;
        mSelfUserId = "";
        mOwnerUserId = "";
        mRoomId = "";
        mUserInfoList = new ArrayList<>();
        mCmdMap = new HashMap<>();
        mInvitationIdMap = new HashMap<>();
        mReceiverInvitationCmdMap = new HashMap<>();
        mReceiverInvitationIdMap = new HashMap<>();
        mSimpleListener = new RoomSimpleMsgListener();
        mGroupListener = new RoomGroupListener();
    }

    public void setListener(ImServiceListener listener) {
        mListener = listener;
    }

    public GroupNotificationData getGroupNotificationData() {
        return mGroupNotificationData;
    }

    public boolean isOwner() {
        return mSelfUserId.equals(mOwnerUserId);
    }

    public void setSelfProfile(final String userName, final String avatarURL,
                               final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isLogin()) {
            TRTCLogger.e(TAG, "set profile fail, not login yet.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "set profile fail, not login yet.");
            }
            return;
        }

        V2TIMUserFullInfo v2TIMUserFullInfo = new V2TIMUserFullInfo();
        v2TIMUserFullInfo.setNickname(userName);
        v2TIMUserFullInfo.setFaceUrl(avatarURL);
        V2TIMManager.getInstance().setSelfInfo(v2TIMUserFullInfo, new V2TIMCallback() {
            @Override
            public void onError(int code, String desc) {
                TRTCLogger.e(TAG, "set profile code:" + code + " msg:" + desc);
                if (callback != null) {
                    callback.onCallback(code, desc);
                }
            }

            @Override
            public void onSuccess() {
                TRTCLogger.i(TAG, "set profile success.");
                if (callback != null) {
                    callback.onCallback(0, "set profile success.");
                }
            }
        });
    }

    public void createRoom(String roomId, final TUIRoomCoreDef.SpeechMode speechMode, final String roomName,
                           final TUIRoomCoreCallback.ActionCallback callback) {
        // 如果已经在一个房间了，则不允许再次进入
        if (isEnterRoom()) {
            TRTCLogger.e(TAG, "you have been in room:" + mRoomId + " can't create another room:" + roomId);
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "you have been in room:" + mRoomId + " can't create another room:"
                        + roomId);
            }
            return;
        }
        if (!isLogin()) {
            TRTCLogger.e(TAG, "im not login yet, create room fail.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "im not login yet, create room fail.");
            }
            return;
        }
        cleanStatus();
        final String realRoomId = ROOM_ID_HEAD + roomId;
        mRoomId = realRoomId;
        mRoomName = roomName;
        mSelfUserId = TUILogin.getUserId();
        mOwnerUserId = mSelfUserId;
        final V2TIMManager imManager = V2TIMManager.getInstance();
        imManager.createGroup(V2TIMManager.GROUP_TYPE_PUBLIC, realRoomId, roomName, new V2TIMValueCallback<String>() {
            @Override
            public void onError(int code, String msg) {
                TRTCLogger.e(TAG, "create room onError, code:" + code + " msg:" + msg);
                if (code == 10036) {
                    msg = mContext.getString(R.string.tuiroom_create_room_limit);
                }
                if (code == 10037) {
                    msg = mContext.getString(R.string.tuiroom_create_or_join_group_limit);
                }
                if (code == 10038) {
                    msg = mContext.getString(R.string.tuiroom_group_member_limit);
                }
                if (code == 10025) {
                    // 10025 表明群主是自己，那么认为创建房间成功
                    getRoomNotification(realRoomId, new TUIRoomCoreCallback.ActionCallback() {
                        @Override
                        public void onCallback(int code, String msg) {
                            if (code == 0) {
                                onCreateSuccess(realRoomId, speechMode, roomName, true, callback);
                            } else {
                                if (callback != null) {
                                    callback.onCallback(code, msg);
                                }
                            }
                        }
                    });
                } else {
                    TRTCLogger.e(TAG, "create room fail, code:" + code + " msg:" + msg);
                    if (callback != null) {
                        callback.onCallback(code, msg);
                    }
                }
            }

            @Override
            public void onSuccess(String s) {
                onCreateSuccess(realRoomId, speechMode, roomName, false,
                        callback);
            }
        });
    }

    public void destroyRoom(final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, "room owner update anchor list into group introduction success");
        V2TIMManager.getInstance().dismissGroup(mRoomId, new V2TIMCallback() {
            @Override
            public void onError(int i, String s) {
                TRTCLogger.e(TAG, "destroy room fail, code:" + i + " msg:" + s);
                if (callback != null) {
                    callback.onCallback(i, s);
                }
            }

            @Override
            public void onSuccess() {
                TRTCLogger.i(TAG, "destroyRoom remove GroupListener roomId: " + mRoomId
                        + " mGroupListener: " + mGroupListener.hashCode());
                V2TIMManager.getInstance().removeSimpleMsgListener(mSimpleListener);
                V2TIMManager.getInstance().removeGroupListener(mGroupListener);
                cleanStatus();
                TRTCLogger.i(TAG, "destroy room success.");
                if (callback != null) {
                    callback.onCallback(0, "destroy room success.");
                }
            }
        });
    }

    public void enterRoom(String roomId, final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, "enterRoom");
        cleanStatus();
        mSelfUserId = TUILogin.getUserId();
        final String realRoomId = ROOM_ID_HEAD + roomId;
        mRoomId = realRoomId;
        V2TIMManager.getInstance().joinGroup(realRoomId, "", new V2TIMCallback() {
            @Override
            public void onError(int i, String s) {
                // 已经是群成员了，可以继续操作
                if (i == 10013) {
                    onSuccess();
                } else {
                    TRTCLogger.e(TAG, "enter room fail, code:" + i + " msg:" + s);
                    if (callback != null) {
                        callback.onCallback(i, s);
                    }
                }
            }

            @Override
            public void onSuccess() {
                List<String> groupList = new ArrayList<>(Arrays.asList(realRoomId));
                V2TIMManager.getGroupManager().getGroupsInfo(groupList,
                        new V2TIMValueCallback<List<V2TIMGroupInfoResult>>() {
                            @Override
                            public void onError(int i, String s) {
                                TRTCLogger.e(TAG, "get group info error, enter room fail. code:" + i
                                        + " msg:" + s);
                                if (callback != null) {
                                    callback.onCallback(CODE_ERROR, "get group info error, enter room fail. "
                                            + "code:" + i + " msg:" + s);
                                }
                            }

                            @Override
                            public void onSuccess(List<V2TIMGroupInfoResult> v2TIMGroupInfoResults) {
                                TRTCLogger.i(TAG, "get group info success.");
                                if (v2TIMGroupInfoResults != null && v2TIMGroupInfoResults.size() == 1) {
                                    final V2TIMGroupInfoResult v2TIMGroupInfoResult = v2TIMGroupInfoResults.get(0);
                                    if (v2TIMGroupInfoResult != null) {
                                        final String ownerUserId = v2TIMGroupInfoResult.getGroupInfo().getOwner();
                                        final String groupName = v2TIMGroupInfoResult.getGroupInfo().getGroupName();
                                        final String notification =
                                                v2TIMGroupInfoResult.getGroupInfo().getNotification();
                                        TRTCLogger.i(TAG, "get group notification:" + notification);
                                        mOwnerUserId = ownerUserId;
                                        mRoomName = groupName;
                                        mGroupNotificationData =
                                                SignalDataUtils.convert2GroupNotificationData(notification);
                                        getGroupMemberList(new TXUserInfoListCallback() {
                                            @Override
                                            public void onCallback(int code, String msg, List<TXUserInfo> list) {
                                                if (code == 0) {
                                                    V2TIMManager.getInstance().addSimpleMsgListener(mSimpleListener);
                                                    V2TIMManager.getInstance().addGroupListener(mGroupListener);
                                                    V2TIMManager.getMessageManager();
                                                    V2TIMManager.getSignalingManager()
                                                            .addSignalingListener(mTIMSignallingListener);
                                                    mUserInfoList = list;
                                                    mIsEnterRoom = true;
                                                    TRTCLogger.i(TAG, "enter room success.");
                                                    if (callback != null) {
                                                        callback.onCallback(CODE_SUCCESS, "success");
                                                    }
                                                } else {
                                                    if (callback != null) {
                                                        callback.onCallback(code, msg);
                                                    }
                                                }
                                            }
                                        });
                                    } else {
                                        if (callback != null) {
                                            callback.onCallback(CODE_ERROR, "v2TIMGroupInfoResult is null");
                                        }
                                    }
                                }
                            }
                        });
            }
        });
    }

    public void exitRoom(final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "not enter room yet, can't exit room.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "not enter room yet, can't exit room.");
            }
            return;
        }
        V2TIMManager.getInstance().quitGroup(mRoomId, new V2TIMCallback() {
            @Override
            public void onError(int i, String s) {
                TRTCLogger.e(TAG, "exit room fail, code:" + i + " msg:" + s);
                if (callback != null) {
                    callback.onCallback(i, s);
                }
            }

            @Override
            public void onSuccess() {
                TRTCLogger.i(TAG, "exit room success.");
                V2TIMManager.getInstance().removeSimpleMsgListener(mSimpleListener);
                V2TIMManager.getInstance().removeGroupListener(mGroupListener);
                cleanStatus();

                if (callback != null) {
                    callback.onCallback(0, "exit room success.");
                }
            }
        });
    }

    public List<TXUserInfo> getUserInfoList() {
        return mUserInfoList;
    }

    public TUIRoomCoreDef.RoomInfo getRoomInfo() {
        TUIRoomCoreDef.RoomInfo roomInfo = new TUIRoomCoreDef.RoomInfo();
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "getRoomInfo fail, not enter room yet.");
            return roomInfo;
        }
        if (mGroupNotificationData == null) {
            TRTCLogger.e(TAG, "mGroupNotificationData is null");
            return roomInfo;
        }
        roomInfo.speechMode = SignallingConstant.VALUE_FREE_SPEECH.equals(mGroupNotificationData.getSpeechMode())
                ? TUIRoomCoreDef.SpeechMode.FREE_SPEECH : TUIRoomCoreDef.SpeechMode.APPLY_SPEECH;
        roomInfo.startTime = mGroupNotificationData.getVersion();
        roomInfo.isChatRoomMuted = mGroupNotificationData.isChatRoomMuted();
        roomInfo.isSpeechForbidden = mGroupNotificationData.isSpeechApplicationForbidden();
        roomInfo.isAllCameraMuted = mGroupNotificationData.isAllCameraMuted();
        roomInfo.isAllMicMuted = mGroupNotificationData.isAllMicMuted();
        roomInfo.isCallingRoll = mGroupNotificationData.isCallingRoll();
        roomInfo.ownerId = mOwnerUserId;
        roomInfo.roomId = mRoomId;
        roomInfo.roomName = mRoomName;
        return roomInfo;
    }

    public void getUserInfo(final String userId, final TXUserInfoCallback callback) {
        if (TextUtils.isEmpty(userId)) {
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "get user info list fail, userId is empty.", new TXUserInfo());
            }
            return;
        }
        List<String> userList = new ArrayList<>();
        userList.add(userId);
        V2TIMManager.getInstance().getUsersInfo(userList, new V2TIMValueCallback<List<V2TIMUserFullInfo>>() {
            @Override
            public void onError(int i, String s) {
                TRTCLogger.e(TAG, "get user info list fail, code:" + i);
                if (callback != null) {
                    callback.onCallback(i, s, new TXUserInfo());
                }
            }

            @Override
            public void onSuccess(List<V2TIMUserFullInfo> v2TIMUserFullInfos) {
                TRTCLogger.i(TAG, "get user info success, code:" + v2TIMUserFullInfos.size());
                TXUserInfo userInfo = new TXUserInfo();
                V2TIMUserFullInfo v2TIMUserFullInfo = v2TIMUserFullInfos.get(0);
                if (v2TIMUserFullInfos != null && v2TIMUserFullInfos.size() == 1) {
                    userInfo.userName = v2TIMUserFullInfo.getNickName();
                    userInfo.userId = v2TIMUserFullInfo.getUserID();
                    userInfo.avatarURL = v2TIMUserFullInfo.getFaceUrl();
                    userInfo.isOwner = v2TIMUserFullInfo.getUserID().equals(mOwnerUserId);
                }
                if (callback != null) {
                    callback.onCallback(0, "success", userInfo);
                }
            }
        });
    }

    private void getGroupMemberList(final TXUserInfoListCallback callback) {
        V2TIMManager.getGroupManager().getGroupMemberList(mRoomId,
                V2TIMGroupMemberFullInfo.V2TIM_GROUP_MEMBER_ROLE_MEMBER, 0,
                new V2TIMValueCallback<V2TIMGroupMemberInfoResult>() {
                    @Override
                    public void onError(final int code, final String desc) {
                        TRTCLogger.e(TAG, "get group member list fail, code:" + code + " msg: " + desc);
                        callback.onCallback(code, desc, new ArrayList<TXUserInfo>());
                    }

                    @Override
                    public void onSuccess(V2TIMGroupMemberInfoResult v2TIMGroupMemberInfoResult) {
                        List<TXUserInfo> list = new ArrayList<>();
                        for (V2TIMGroupMemberFullInfo info : v2TIMGroupMemberInfoResult.getMemberInfoList()) {
                            TXUserInfo userInfo = new TXUserInfo();
                            userInfo.userName = info.getNickName();
                            userInfo.userId = info.getUserID();
                            userInfo.avatarURL = info.getFaceUrl();
                            userInfo.isOwner = info.getUserID().equals(mOwnerUserId);
                            list.add(userInfo);
                        }
                        if (callback != null) {
                            callback.onCallback(0, "success", list);
                        }
                    }
                });
    }

    public void transferRoomMaster(final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "transfer room master fail, not enter room yet.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "transfer room master fail, not enter room yet.");
            }
            return;
        }
        if (!isOwner()) {
            TRTCLogger.e(TAG, "transfer room master fail, is not owner");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "transfer room master fail, is not owner");
            }
            return;
        }
        V2TIMManager.getGroupManager().transferGroupOwner(mRoomId, mSelfUserId, new V2TIMCallback() {
            @Override
            public void onSuccess() {
                callback.onCallback(0, "success");
            }

            @Override
            public void onError(int code, String msg) {
                callback.onCallback(0, msg);
            }
        });
    }

    public void sendRoomTextMsg(String msg, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "send room text fail, not enter room yet.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "send room text fail, not enter room yet.");
            }
            return;
        }

        V2TIMManager.getInstance().sendGroupTextMessage(msg, mRoomId, V2TIMMessage.V2TIM_PRIORITY_LOW,
                new V2TIMValueCallback<V2TIMMessage>() {
                    @Override
                    public void onError(int i, String s) {
                        TRTCLogger.e(TAG, "message send fail, code: " + i + " msg:" + s);
                        if (callback != null) {
                            callback.onCallback(i, s);
                        }
                    }

                    @Override
                    public void onSuccess(V2TIMMessage v2TIMMessage) {
                        if (callback != null) {
                            callback.onCallback(0, "send group message success.");
                        }
                    }
                });
    }

    public void sendRoomCustomMsg(String data, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "send room custom msg fail, not enter room yet.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "send room custom msg fail, not enter room yet.");
            }
            return;
        }

        V2TIMManager.getInstance().sendGroupCustomMessage(data.getBytes(), mRoomId, V2TIMMessage.V2TIM_PRIORITY_LOW,
                new V2TIMValueCallback<V2TIMMessage>() {
                    @Override
                    public void onError(int i, String s) {
                        TRTCLogger.e(TAG, "send group custom message failed code: " + i + " msg:" + s);
                        if (callback != null) {
                            callback.onCallback(i, s);
                        }
                    }

                    @Override
                    public void onSuccess(V2TIMMessage v2TIMMessage) {
                        if (callback != null) {
                            callback.onCallback(0, "send group message success.");
                        }
                    }
                });
    }

    public void muteUserMicrophone(String userId, boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        String cmd = SignallingConstant.CMD_MUTE_USER_MICROPHONE;
        if (!isAvailable(cmd, userId, callback)) {
            return;
        }
        if (!isOwner()) {
            TRTCLogger.e(TAG, "is not owner");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "is not owner");
            }
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(userId);
        signallingData.getData().setMute(mute);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendInvite(cmd, userId, json, TIME_OUT_COUNT_SHORT, callback);
    }

    public void muteUserCamera(String userId, boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        String cmd = SignallingConstant.CMD_MUTE_USER_CAMERA;
        if (!isAvailable(cmd, userId, callback)) {
            return;
        }
        if (!isOwner()) {
            TRTCLogger.e(TAG, "is not owner");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "is not owner");
            }
            return;
        }
        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(userId);
        signallingData.getData().setMute(mute);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendInvite(cmd, userId, json, TIME_OUT_COUNT_SHORT, callback);
    }

    public void kickOffUser(String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        String cmd = SignallingConstant.CMD_KICK_OFF_USER;
        if (!isAvailable(cmd, userId, callback)) {
            return;
        }

        if (!isOwner()) {
            TRTCLogger.e(TAG, "is not owner");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "is not owner");
            }
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(userId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendInvite(cmd, userId, json, TIME_OUT_COUNT_SHORT, callback);
    }

    public void muteAllUsersMicrophone(boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isSetGroupNotificationAvailable(callback)) {
            return;
        }
        mGroupNotificationData.setAllMicMuted(mute);
        setGroupNotificationData(callback);
    }

    public void muteAllUsersCamera(boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isSetGroupNotificationAvailable(callback)) {
            return;
        }
        mGroupNotificationData.setAllCameraMuted(mute);
        setGroupNotificationData(callback);
    }

    public void muteChatRoom(boolean mute, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isSetGroupNotificationAvailable(callback)) {
            return;
        }
        mGroupNotificationData.setChatRoomMuted(mute);
        setGroupNotificationData(callback);
    }

    public void setCallingRoll(boolean isCallingRoll, final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isSetGroupNotificationAvailable(callback)) {
            return;
        }
        mGroupNotificationData.setCallingRoll(isCallingRoll);
        setGroupNotificationData(callback);
    }

    public void sendSpeechInvitation(String userId, final TUIRoomCoreCallback.InvitationCallback callback) {
        if (!isOwner()) {
            TRTCLogger.e(TAG, "mute user microphone fail, is not owner");
            if (callback != null) {
                callback.onError(CODE_ERROR, "sendSpeechInvitation fail, is not owner");
            }
        }

        String cmd = SignallingConstant.CMD_SEND_SPEECH_INVITATION;
        if (!isAvailable(cmd, userId, callback)) {
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(userId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendInvite(cmd, userId, json, TIME_OUT_COUNT_LONG, callback);
    }

    public void sendSpeechApplication(final TUIRoomCoreCallback.InvitationCallback callback) {
        String receiverId = mOwnerUserId;
        if (TextUtils.isEmpty(receiverId)) {
            TRTCLogger.e(TAG, "mOwnerUserId is null");
            if (callback != null) {
                callback.onError(CODE_ERROR, "mOwnerUserId is null");
            }
        }

        String cmd = SignallingConstant.CMD_SEND_SPEECH_APPLICATION;
        if (!isAvailable(cmd, receiverId, callback)) {
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(receiverId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        TRTCLogger.i(TAG, "sendSpeechApplication json: " + json);
        sendInvite(cmd, receiverId, json, TIME_OUT_COUNT_LONG, callback);
    }

    public void cancelSpeechInvitation(String userId, final TUIRoomCoreCallback.ActionCallback callback) {
        cancelInvitation(userId, SignallingConstant.CMD_SEND_SPEECH_INVITATION, callback);
    }

    public void cancelSpeechApplication(final TUIRoomCoreCallback.ActionCallback callback) {
        String receiverId = mOwnerUserId;
        cancelInvitation(receiverId, SignallingConstant.CMD_SEND_SPEECH_APPLICATION, callback);
    }

    public void sendOffAllSpeakers(Set<String> userIdList, TUIRoomCoreCallback.ActionCallback callback) {
        String cmd = SignallingConstant.CMD_SEND_OFF_ALL_SPEAKERS;
        isAvailable(cmd, "", callback);
        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendGroupInvite(cmd, mRoomId, userIdList, json, TIME_OUT_COUNT_LONG, callback);
    }

    public void replySpeechApplication(boolean agree, String userId,
                                       final TUIRoomCoreCallback.ActionCallback callback) {
        if (TextUtils.isEmpty(userId)) {
            TRTCLogger.e(TAG, "userId is null");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "userId is null");
            }
            return;
        }
        String inviteId = mReceiverInvitationCmdMap.get(SignallingConstant.CMD_SEND_SPEECH_APPLICATION + userId);
        if (TextUtils.isEmpty(inviteId)) {
            TRTCLogger.e(TAG, "you do not receive the invite");
            callback.onCallback(CODE_ERROR, "you do not receive the invite");
            return;
        }
        if (agree) {
            acceptInvite(inviteId, "replySpeechInvitation", callback);
        } else {
            rejectInvite(inviteId, "replySpeechInvitation", callback);
        }
    }

    public void replySpeechInvitation(boolean agree, final TUIRoomCoreCallback.ActionCallback callback) {
        String receiverId = mOwnerUserId;
        if (TextUtils.isEmpty(receiverId)) {
            TRTCLogger.e(TAG, "mOwnerUserId is null");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mOwnerUserId is null");
            }
            return;
        }
        String inviteId = mReceiverInvitationCmdMap.get(SignallingConstant.CMD_SEND_SPEECH_INVITATION + receiverId);
        if (TextUtils.isEmpty(inviteId)) {
            TRTCLogger.e(TAG, "you do not receive the invite");
            callback.onCallback(CODE_ERROR, "you do not receive the invite");
            return;
        }
        if (agree) {
            acceptInvite(inviteId, "replySpeechInvitation", callback);
        } else {
            rejectInvite(inviteId, "replySpeechInvitation", callback);
        }
    }

    public void replyCallingRoll(final TUIRoomCoreCallback.ActionCallback callback) {
        if (mGroupNotificationData == null) {
            TRTCLogger.e(TAG, "mGroupNotificationData is null");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mGroupNotificationData is null");
            }
            return;
        }
        if (!mGroupNotificationData.isCallingRoll()) {
            TRTCLogger.e(TAG, "this is not in calling roll");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "this is not in calling roll");
            }
            return;
        }
        String receiverId = mOwnerUserId;
        if (TextUtils.isEmpty(receiverId)) {
            TRTCLogger.e(TAG, "mOwnerUserId is null");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mOwnerUserId is null");
            }
            return;
        }

        String cmd = SignallingConstant.CMD_REPLAY_CALLING_ROLL;
        if (!isAvailable(cmd, receiverId, callback)) {
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        signallingData.getData().setReceiverId(receiverId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        TRTCLogger.i(TAG, "replySpeechApplication json: " + json);
        sendInvite(cmd, receiverId, json, TIME_OUT_COUNT_SHORT, callback);
    }

    public void sendOffSpeaker(final String userId, TUIRoomCoreCallback.ActionCallback callback) {
        String cmd = SignallingConstant.CMD_SEND_OFF_SPEAKER;
        if (!isAvailable(cmd, "", callback)) {
            return;
        }

        SignallingData signallingData = createSignallingData(cmd, mRoomId);
        Gson gson = new Gson();
        String json = gson.toJson(signallingData);
        sendInvite(cmd, userId, json, TIME_OUT_COUNT_SHORT, callback);
    }

    public void forbidSpeechApplication(final boolean forbid, TUIRoomCoreCallback.ActionCallback callback) {
        if (!isSetGroupNotificationAvailable(callback)) {
            return;
        }
        mGroupNotificationData.setSpeechApplicationForbidden(forbid);
        setGroupNotificationData(callback);
    }

    private void cancelInvitation(String userId, String cmd, TUIRoomCoreCallback.ActionCallback callback) {
        CmdInvitation cmdInvitation = mCmdMap.get(cmd + userId);
        if (cmdInvitation == null) {
            TRTCLogger.e(TAG, "the cancel command is expired");
            callback.onCallback(CODE_ERROR, "the cancel command is expired");
            return;
        }

        if (TextUtils.isEmpty(cmdInvitation.inviteId)) {
            TRTCLogger.e(TAG, "inviteId is null");
            callback.onCallback(CODE_ERROR, "inviteId is null");
            return;
        }

        cancelInvite(cmdInvitation.inviteId, callback);
    }

    private boolean isTUIRoomData(SignallingData signallingData) {
        if (signallingData == null) {
            TRTCLogger.e(TAG, "signallingData is null");
            return false;
        }
        String businessId = signallingData.getBusinessID();
        return SignallingConstant.VALUE_BUSINESS_ID.equals(businessId);
    }

    private void getRoomNotification(String roomId, final TUIRoomCoreCallback.ActionCallback callback) {
        List<String> groupList = new ArrayList<>(Arrays.asList(roomId));
        V2TIMManager.getGroupManager().getGroupsInfo(groupList, new V2TIMValueCallback<List<V2TIMGroupInfoResult>>() {
            @Override
            public void onError(int i, String s) {
                TRTCLogger.e(TAG, "get group info error, enter room fail. code:" + i + " msg:" + s);
                if (callback != null) {
                    callback.onCallback(CODE_ERROR, "get group info error, enter room fail. code:" + i + " msg:"
                            + s);
                }
            }

            @Override
            public void onSuccess(List<V2TIMGroupInfoResult> v2TIMGroupInfoResults) {
                TRTCLogger.i(TAG, "get group info success.");
                if (v2TIMGroupInfoResults != null && v2TIMGroupInfoResults.size() == 1) {
                    final V2TIMGroupInfoResult v2TIMGroupInfoResult = v2TIMGroupInfoResults.get(0);
                    if (v2TIMGroupInfoResult != null) {
                        final String notification = v2TIMGroupInfoResult.getGroupInfo().getNotification();
                        TRTCLogger.e(TAG, "get RoomNotification content:" + notification);
                        mGroupNotificationData = SignalDataUtils.convert2GroupNotificationData(notification);
                        callback.onCallback(CODE_SUCCESS, MESSAGE_SUCCESS);
                    } else {
                        if (callback != null) {
                            callback.onCallback(CODE_ERROR, "v2TIMGroupInfoResult is null");
                        }
                    }
                } else {
                    callback.onCallback(CODE_ERROR, "v2TIMGroupInfoResults is not one");
                }
            }
        });
    }

    private void onCreateSuccess(final String roomId, final TUIRoomCoreDef.SpeechMode speechMode,
                                 final String roomName, boolean isReEnterRoom,
                                 final TUIRoomCoreCallback.ActionCallback callback) {
        V2TIMManager.getInstance().addSimpleMsgListener(mSimpleListener);
        V2TIMManager.getInstance().addGroupListener(mGroupListener);
        V2TIMManager.getMessageManager();
        V2TIMManager.getSignalingManager().addSignalingListener(mTIMSignallingListener);
        if (isReEnterRoom) {
            getGroupMemberList(new TXUserInfoListCallback() {
                @Override
                public void onCallback(int code, String msg, List<TXUserInfo> userInfoList) {
                    if (code == CODE_SUCCESS) {
                        TRTCLogger.i(TAG, "create room success.");
                        mIsEnterRoom = true;
                        mUserInfoList = userInfoList;
                        if (callback != null) {
                            callback.onCallback(0, "create room success.");
                        }
                    } else {
                        if (callback != null) {
                            callback.onCallback(CODE_ERROR, "get group member list failed");
                        }
                    }
                }
            });
        } else {
            GroupNotificationData groupNotificationData = createGroupNotification(
                    speechMode, false, false, false,
                    false, false, System.currentTimeMillis());
            setGroupInfo(roomId, roomName, groupNotificationData, null);
            TRTCLogger.i(TAG, "create room success.");
            if (callback != null) {
                callback.onCallback(0, "create room success.");
            }
            mIsEnterRoom = true;
        }

    }

    private GroupNotificationData createGroupNotification(TUIRoomCoreDef.SpeechMode speechMode,
                                                          boolean isChatRoomMuted,
                                                          boolean isSpeechApplicationForbidden,
                                                          boolean isAllCameraMuted,
                                                          boolean isAllMicMuted,
                                                          boolean isCallingRoll,
                                                          long startTime) {
        GroupNotificationData data = new GroupNotificationData();
        data.setSpeechMode(speechMode == TUIRoomCoreDef.SpeechMode.FREE_SPEECH
                ? SignallingConstant.VALUE_FREE_SPEECH : SignallingConstant.VALUE_APPLY_SPEECH);
        data.setChatRoomMuted(isChatRoomMuted);
        data.setSpeechApplicationForbidden(isSpeechApplicationForbidden);
        data.setAllCameraMuted(isAllCameraMuted);
        data.setAllMicMuted(isAllMicMuted);
        data.setStartTime(startTime);
        data.setCallingRoll(isCallingRoll);
        return data;
    }

    /**
     * 设置群公告
     */
    private void setGroupInfo(String roomId, String roomName, final GroupNotificationData groupNotificationData,
                              final V2TIMCallback callback) {
        if (groupNotificationData == null) {
            TRTCLogger.e(TAG, "set error, groupNotificationData is null");
            return;
        }
        if (!isOwner()) {
            TRTCLogger.e(TAG, "set error, this user is not owner");
            return;
        }
        V2TIMGroupInfo groupInfo = new V2TIMGroupInfo();
        groupInfo.setGroupID(roomId);
        groupInfo.setGroupName(roomName);
        groupInfo.setGroupAddOpt(V2TIMGroupInfo.V2TIM_GROUP_ADD_ANY);
        Gson gson = new Gson();
        String notificationJson = gson.toJson(groupNotificationData);
        groupInfo.setNotification(notificationJson);
        V2TIMManager.getGroupManager().setGroupInfo(groupInfo, new V2TIMCallback() {
            @Override
            public void onError(int code, String msg) {
                TRTCLogger.e(TAG, "set group info error:" + code + " msg:" + msg);
                if (callback != null) {
                    callback.onError(code, msg);
                }
            }

            @Override
            public void onSuccess() {
                TRTCLogger.i(TAG, "set group info success");
                mGroupNotificationData = groupNotificationData;
                if (callback != null) {
                    callback.onSuccess();
                }
            }
        });
    }

    private boolean isLogin() {
        return TUILogin.isUserLogined();
    }

    private boolean isEnterRoom() {
        return isLogin() && mIsEnterRoom;
    }

    private void setGroupNotificationData(final TUIRoomCoreCallback.ActionCallback callback) {
        setGroupInfo(mRoomId, mRoomName, mGroupNotificationData, new V2TIMCallback() {
            @Override
            public void onSuccess() {
                callback.onCallback(0, "success");
            }

            @Override
            public void onError(int code, String msg) {
                TRTCLogger.e(TAG, "send group custom message failed code: " + code + " msg:" + msg);
                callback.onCallback(code, msg);
            }
        });
    }

    private boolean isSetGroupNotificationAvailable(final TUIRoomCoreCallback.ActionCallback callback) {
        if (!isEnterRoom()) {
            TRTCLogger.e(TAG, "fail, not enter room yet.");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "fail, not enter room yet");
            }
            return false;
        }
        if (!isOwner()) {
            TRTCLogger.e(TAG, "is not owner");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "is not owner");
            }
            return false;
        }
        if (mGroupNotificationData == null) {
            TRTCLogger.e(TAG, "mGroupNotificationData is null");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mGroupNotificationData is null");
            }
            return false;
        }
        if (TextUtils.isEmpty(mRoomId)) {
            TRTCLogger.e(TAG, "mRoomId is empty");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mRoomId is null");
            }
            return false;
        }
        if (TextUtils.isEmpty(mRoomName)) {
            TRTCLogger.e(TAG, "mRoomName is empty");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mRoomName is null");
            }
            return false;
        }
        return true;
    }

    private boolean isAvailable(String cmd, String receiver, TUIRoomCoreCallback.InvitationCallback callback) {
        if (TextUtils.isEmpty(mRoomId)) {
            TRTCLogger.e(TAG, "called failed, roomId is empty");
            if (callback != null) {
                callback.onError(CODE_ERROR, "called failed, roomId is empty");
            }
            return false;
        }
        if (mCmdMap.containsKey(cmd + receiver)) {
            TRTCLogger.e(TAG, "called limited, please wait the response of previous invited");
            if (callback != null) {
                callback.onError(CODE_ERROR, "called limited, please wait the response of previous invited");
            }
            return false;
        }
        return true;
    }

    private boolean isAvailable(String cmd, String receiver, TUIRoomCoreCallback.ActionCallback callback) {
        if (TextUtils.isEmpty(mRoomId)) {
            TRTCLogger.e(TAG, "mute user microphone fail, roomId is empty");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "mute user microphone fail, roomId is empty");
            }
            return false;
        }
        if (mCmdMap.containsKey(cmd + receiver)) {
            TRTCLogger.e(TAG, "called limited, please wait the response of previous invited");
            if (callback != null) {
                callback.onCallback(CODE_ERROR, "called limited, please wait the response of previous invited");
            }
            return false;
        }
        return true;
    }

    private SignallingData createSignallingData(String cmd, String roomId) {
        SignallingData signallingData = new SignallingData();
        signallingData.setPlatform(SignallingConstant.VALUE_PLATFORM);
        signallingData.setVersion(SignallingConstant.VALUE_VERSION);
        signallingData.setBusinessID(SignallingConstant.VALUE_BUSINESS_ID);
        SignallingData.DataInfo data = new SignallingData.DataInfo();
        signallingData.setData(data);
        data.setCmd(cmd);
        data.setRoomId(roomId);
        return signallingData;
    }

    private void sendInvite(final String cmd, final String receiver, String data, int timeout,
                            final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, String.format("sendInvite, receiver=%s, data=%s", receiver, data));
        final CmdInvitation cmdInvitation = new CmdInvitation();
        cmdInvitation.cmd = cmd + receiver;
        cmdInvitation.actionCallback = callback;
        cmdInvitation.isNeedAgree = false;
        mCmdMap.put(cmdInvitation.cmd, cmdInvitation);
        mInviteId = V2TIMManager.getSignalingManager().invite(receiver, data, false, null,
                timeout, new V2TIMCallback() {
                    @Override
                    public void onError(int code, String desc) {
                        mCmdMap.remove(cmdInvitation.cmd);
                        if (callback != null) {
                            callback.onCallback(code, desc);
                        }
                    }

                    @Override
                    public void onSuccess() {
                        if (!TextUtils.isEmpty(mInviteId)) {
                            mInvitationIdMap.put(mInviteId, cmdInvitation);
                            cmdInvitation.inviteId = mInviteId;
                        }
                    }
                });
    }

    private void sendInvite(final String cmd, final String receiver, String data, int timeout,
                            final TUIRoomCoreCallback.InvitationCallback callback) {
        TRTCLogger.i(TAG, String.format("sendInvite, receiver=%s, data=%s", receiver, data));
        final CmdInvitation cmdInvitation = new CmdInvitation();
        cmdInvitation.cmd = cmd + receiver;
        cmdInvitation.invitationCallback = callback;
        cmdInvitation.isNeedAgree = true;
        mCmdMap.put(cmdInvitation.cmd, cmdInvitation);
        mInviteId = V2TIMManager.getSignalingManager().invite(receiver, data, false, null,
                timeout, new V2TIMCallback() {
                    @Override
                    public void onError(int code, String desc) {
                        mCmdMap.remove(cmdInvitation.cmd);
                        if (callback != null) {
                            callback.onError(code, desc);
                        }
                    }

                    @Override
                    public void onSuccess() {
                        if (!TextUtils.isEmpty(mInviteId)) {
                            mInvitationIdMap.put(mInviteId, cmdInvitation);
                            cmdInvitation.inviteId = mInviteId;
                        }
                    }
                });
    }

    private void sendGroupInvite(final String cmd, String groupId, Set<String> inviteeList, String data, int timeout,
                                   final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, String.format("sendGroupInvite, groupId=%s, inviteeList=%s, data=%s", groupId,
                Arrays.toString(inviteeList.toArray()), data));
        final CmdInvitation cmdInvitation = new CmdInvitation();
        cmdInvitation.cmd = cmd;
        cmdInvitation.actionCallback = callback;
        cmdInvitation.isGroupInvite = true;
        cmdInvitation.inviteIdList = inviteeList;
        mCmdMap.put(cmdInvitation.cmd, cmdInvitation);
        mInviteId = V2TIMManager.getSignalingManager().inviteInGroup(groupId, new ArrayList<String>(inviteeList), data,
                false, timeout,
                new V2TIMCallback() {
                    @Override
                    public void onError(int code, String desc) {
                        mCmdMap.remove(cmdInvitation.cmd);
                        if (callback != null) {
                            callback.onCallback(code, desc);
                        }
                    }

                    @Override
                    public void onSuccess() {
                        if (!TextUtils.isEmpty(mInviteId)) {
                            mInvitationIdMap.put(mInviteId, cmdInvitation);
                            cmdInvitation.inviteId = mInviteId;
                        }
                    }
                });
    }

    private void onGroupNotificationDataChanged(GroupNotificationData groupNotificationData) {
        if (groupNotificationData == null) {
            TRTCLogger.i(TAG, "groupNotificationData is null");
            return;
        }

        if (mGroupNotificationData == null) {
            TRTCLogger.i(TAG, "mGroupNotificationData is null");
            return;
        }
        boolean isAllCameraMuted = groupNotificationData.isAllCameraMuted();
        if (isAllCameraMuted != mGroupNotificationData.isAllCameraMuted()) {
            if (mListener != null) {
                mListener.onAllCameraMuted(isAllCameraMuted);
            }
        }

        boolean isAllMicMuted = groupNotificationData.isAllMicMuted();
        if (isAllMicMuted != mGroupNotificationData.isAllMicMuted()) {
            if (mListener != null) {
                mListener.onAllMicrophoneMuted(isAllMicMuted);
            }
        }

        boolean isChatRoomMuted = groupNotificationData.isChatRoomMuted();
        if (isChatRoomMuted != mGroupNotificationData.isChatRoomMuted()) {
            if (mListener != null) {
                mListener.onChatRoomMuted(isChatRoomMuted);
            }
        }

        boolean isCallingRoll = groupNotificationData.isCallingRoll();
        if (isCallingRoll != mGroupNotificationData.isCallingRoll()) {
            if (mListener != null) {
                mListener.onCallingRoll(mOwnerUserId, isCallingRoll);
            }
        }

        boolean isSpeechApplicationForbidden = groupNotificationData.isSpeechApplicationForbidden();
        if (isSpeechApplicationForbidden != mGroupNotificationData.isSpeechApplicationForbidden()) {
            if (mListener != null) {
                mListener.onSpeechApplicationForbidden(isSpeechApplicationForbidden);
            }
        }
        mGroupNotificationData = groupNotificationData;
    }

    private void handleInvitation(String inviteID, String inviter, InvitationState state) {
        CmdInvitation cmdInvitation = mInvitationIdMap.get(inviteID);
        if (cmdInvitation == null) {
            return;
        }
        if (cmdInvitation.isGroupInvite) {
            TUIRoomCoreCallback.ActionCallback actionCallback = cmdInvitation.actionCallback;
            Set<String> inviteIdList = cmdInvitation.inviteIdList;
            if (inviteIdList != null) {
                inviteIdList.remove(inviter);
                if (inviteIdList.isEmpty()) {
                    if (actionCallback != null) {
                        actionCallback.onCallback(0, "success");
                    }
                    mCmdMap.remove(cmdInvitation.cmd);
                    mInvitationIdMap.remove(inviteID);
                }
            }
        } else if (cmdInvitation.isNeedAgree) {
            TUIRoomCoreCallback.InvitationCallback invitationCallback = cmdInvitation.invitationCallback;
            if (invitationCallback != null) {
                switch (state) {
                    case ACCEPT:
                        invitationCallback.onInviteeAccepted();
                        break;
                    case REJECT:
                        invitationCallback.onInviteeRejected();
                        break;
                    case CANCEL:
                        invitationCallback.onInvitationCancelled();
                        break;
                    case TIMEOUT:
                        invitationCallback.onInvitationTimeout();
                        break;
                    default:
                        invitationCallback.onError(CODE_ERROR, "invitation error state is " + state);
                        break;
                }
            }
            mCmdMap.remove(cmdInvitation.cmd);
            mInvitationIdMap.remove(inviteID);
        } else {
            TUIRoomCoreCallback.ActionCallback actionCallback = cmdInvitation.actionCallback;
            if (actionCallback != null) {
                switch (state) {
                    case ACCEPT:
                        actionCallback.onCallback(-0, "success");
                        break;
                    case CANCEL:
                        actionCallback.onCallback(CODE_ERROR, "the invitation is canceled");
                        break;
                    case TIMEOUT:
                        actionCallback.onCallback(CODE_ERROR, "the invitation is timeout");
                        break;
                    default:
                        actionCallback.onCallback(CODE_ERROR, "invitation error state is " + state);
                        break;
                }
            }
            mCmdMap.remove(cmdInvitation.cmd);
            mInvitationIdMap.remove(inviteID);
        }
    }

    private void onReceiveCancelCmd(String inviteId, String invite) {
        String cmd = mReceiverInvitationIdMap.get(inviteId);
        if (TextUtils.isEmpty(cmd)) {
            return;
        }
        switch (cmd) {
            case SignallingConstant.CMD_SEND_SPEECH_INVITATION:
                if (mListener != null) {
                    mListener.onReceiveInvitationCancelled(invite);
                }
                break;

            case SignallingConstant.CMD_SEND_SPEECH_APPLICATION:
                if (mListener != null) {
                    mListener.onSpeechApplicationCancelled(invite);
                }
                break;
            default:
                TRTCLogger.i(TAG, "onReceiveCancelCmd cmd: " + cmd);
                break;
        }
        mReceiverInvitationCmdMap.remove(cmd + invite);
        mReceiverInvitationIdMap.remove(inviteId);
    }

    private void onReceiveTimeoutCmd(String inviteId, String invite) {
        String cmd = mReceiverInvitationIdMap.get(inviteId);
        if (TextUtils.isEmpty(cmd)) {
            return;
        }
        mReceiverInvitationCmdMap.remove(cmd + invite);
        mReceiverInvitationIdMap.remove(inviteId);
    }

    private void acceptInvite(String inviteId, final String cmd, final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, String.format("acceptInvite, inviteId=%s", inviteId));
        V2TIMManager.getSignalingManager().accept(inviteId, null, new V2TIMCallback() {
            @Override
            public void onError(int code, String desc) {
                TRTCLogger.e(TAG, "accept the cmd failed, cmd: " + cmd + " code " + code + " msg" + desc);
                if (callback != null) {
                    callback.onCallback(code, desc);
                }
            }

            @Override
            public void onSuccess() {
                if (callback != null) {
                    callback.onCallback(CODE_SUCCESS, MESSAGE_SUCCESS);
                }
            }
        });
    }

    private void rejectInvite(String inviteId, String data, final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, String.format("rejectInvite, inviteId=%s, data=%s", inviteId, data));
        V2TIMManager.getSignalingManager().reject(inviteId, data, new V2TIMCallback() {
            @Override
            public void onError(int code, String desc) {
                TRTCLogger.e(TAG, "reject the cmd failed, code: " + code + " msg" + desc);
                if (callback != null) {
                    callback.onCallback(code, desc);
                }
            }

            @Override
            public void onSuccess() {
                if (callback != null) {
                    callback.onCallback(CODE_SUCCESS, MESSAGE_SUCCESS);
                }
            }
        });
    }

    private void cancelInvite(String inviteId, final TUIRoomCoreCallback.ActionCallback callback) {
        TRTCLogger.i(TAG, String.format("cancelInvite, inviteId=%s", inviteId));
        V2TIMManager.getSignalingManager().cancel(inviteId, "", new V2TIMCallback() {
            @Override
            public void onError(int code, String desc) {
                TRTCLogger.e(TAG, "reject the cmd failed, code: " + code + " msg" + desc);
                if (callback != null) {
                    callback.onCallback(code, desc);
                }
            }

            @Override
            public void onSuccess() {
                if (callback != null) {
                    callback.onCallback(0, "success");
                }
            }
        });
    }

    private void handleNewInvitation(String inviteID, final String inviter, SignallingData signallingData) {
        if (signallingData == null) {
            TRTCLogger.i(TAG, "signallingData is null");
        }
        final SignallingData.DataInfo dataInfo = signallingData.getData();
        if (dataInfo == null) {
            TRTCLogger.i(TAG, "dataInfo is null");
        }
        String cmd = dataInfo.getCmd();
        TRTCLogger.i(TAG, "cmd is " + cmd);
        switch (cmd) {
            case SignallingConstant.CMD_MUTE_USER_MICROPHONE:
                onReceiveMuteUserMicCmd(inviteID, cmd, dataInfo.isMute());
                break;
            case SignallingConstant.CMD_MUTE_USER_CAMERA:
                onReceiveMuteUserCameraCmd(inviteID, cmd, dataInfo.isMute());
                break;
            case SignallingConstant.CMD_KICK_OFF_USER:
                onReceiveKickUserCmd(inviteID, cmd, inviter);
                break;
            case SignallingConstant.CMD_REPLAY_CALLING_ROLL:
                onReceiveReplyCallRollCmd(inviteID, cmd, inviter);
                break;

            case SignallingConstant.CMD_SEND_OFF_SPEAKER:
            case SignallingConstant.CMD_SEND_OFF_ALL_SPEAKERS:
                onReceiveSendOffSpeakerCmd(inviteID, cmd, inviter);
                break;

            case SignallingConstant.CMD_SEND_SPEECH_INVITATION:
                onReceiveSendSpeechInvitationCmd(inviteID, cmd, inviter);
                break;

            case SignallingConstant.CMD_SEND_SPEECH_APPLICATION:
                onReceiveSendSpeechApplicationCmd(inviteID, cmd, inviter);
                break;
            default:
                break;
        }
    }

    private void onReceiveMuteUserMicCmd(String inviteID, String cmd, final boolean isMuted) {
        acceptInvite(inviteID, cmd, new TUIRoomCoreCallback.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code == CODE_SUCCESS) {
                    if (mListener != null) {
                        mListener.onMicrophoneMuted(isMuted);
                    }
                }
            }
        });
    }

    private void onReceiveMuteUserCameraCmd(String inviteID, String cmd, final boolean isMuted) {
        acceptInvite(inviteID, cmd, new TUIRoomCoreCallback.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code == CODE_SUCCESS) {
                    if (mListener != null) {
                        mListener.onCameraMuted(isMuted);
                    }
                }
            }
        });
    }

    private void onReceiveKickUserCmd(String inviteID, String cmd, final String inviter) {
        acceptInvite(inviteID, cmd, new TUIRoomCoreCallback.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code == CODE_SUCCESS) {
                    if (mListener != null) {
                        mListener.onReceiveKickedOff(inviter);
                    }
                }
            }
        });
    }

    private void onReceiveReplyCallRollCmd(String inviteID, String cmd, final String inviter) {
        acceptInvite(inviteID, cmd, new TUIRoomCoreCallback.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code == CODE_SUCCESS) {
                    if (mListener != null) {
                        mListener.onMemberReplyCallingRoll(inviter);
                    }
                }
            }
        });
    }

    private void onReceiveSendOffSpeakerCmd(String inviteID, String cmd, final String inviter) {
        acceptInvite(inviteID, cmd, new TUIRoomCoreCallback.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code == CODE_SUCCESS) {
                    if (mListener != null) {
                        mListener.onOrderedToExitSpeechState(inviter);
                    }
                }
            }
        });
    }

    private void onReceiveSendSpeechInvitationCmd(String inviteID, String cmd, final String inviter) {
        mReceiverInvitationCmdMap.put((cmd + inviter), inviteID);
        mReceiverInvitationIdMap.put(inviteID, cmd);
        if (mListener != null) {
            mListener.onReceiveSpeechInvitation(inviter);
        }
    }

    private void onReceiveSendSpeechApplicationCmd(String inviteID, String cmd, final String inviter) {
        mReceiverInvitationCmdMap.put((cmd + inviter), inviteID);
        mReceiverInvitationIdMap.put(inviteID, cmd);
        if (mListener != null) {
            mListener.onReceiveSpeechApplication(inviter);
        }
    }

    private void cleanStatus() {
        mIsEnterRoom = false;
        mInvitationIdMap.clear();
        mUserInfoList.clear();
        mCmdMap.clear();
        mReceiverInvitationCmdMap.clear();
        mReceiverInvitationIdMap.clear();
        mGroupNotificationData = null;
        mRoomId = "";
        mInviteId = "";
        mOwnerUserId = "";
        mRoomName = "";
        mSelfUserId = "";
        mOwnerUserId = "";
    }

    private class RoomSimpleMsgListener extends V2TIMSimpleMsgListener {

        @Override
        public void onRecvGroupTextMessage(String msgID, String groupID, V2TIMGroupMemberInfo sender, String text) {
            TRTCLogger.i(TAG, "onReceiveGroupTextMessage: " + text);
            final TXUserInfo txUserInfo = new TXUserInfo();
            txUserInfo.userId = sender.getUserID();
            txUserInfo.userName = sender.getNickName();
            txUserInfo.avatarURL = sender.getFaceUrl();
            txUserInfo.isOwner = sender.getUserID().equals(mOwnerUserId);
            if (mListener != null) {
                mListener.onRoomReceiveRoomTextMsg(groupID, text, txUserInfo);
            }
        }

        @Override
        public void onRecvGroupCustomMessage(String msgID, String groupID, V2TIMGroupMemberInfo sender,
                                             byte[] customData) {
            String customStr = new String(customData);
            TRTCLogger.i(TAG, "onRecvGroupCustomMessage: " + customStr);
            final TXUserInfo txUserInfo = new TXUserInfo();
            txUserInfo.userId = sender.getUserID();
            txUserInfo.userName = sender.getNickName();
            txUserInfo.avatarURL = sender.getFaceUrl();
            txUserInfo.isOwner = sender.getUserID().equals(mOwnerUserId);
            if (mListener != null) {
                mListener.onRoomReceiveRoomCustomMsg(groupID, customStr, txUserInfo);
            }
        }
    }

    private class RoomGroupListener extends V2TIMGroupListener {
        @Override
        public void onMemberEnter(String groupID, List<V2TIMGroupMemberInfo> memberList) {
            if (!groupID.equals(mRoomId)) {
                return;
            }
            if (mListener != null && memberList != null) {
                for (V2TIMGroupMemberInfo member : memberList) {
                    TXUserInfo userInfo = new TXUserInfo();
                    userInfo.userId = member.getUserID();
                    userInfo.userName = member.getNickName();
                    userInfo.avatarURL = member.getFaceUrl();
                    userInfo.isOwner = member.getUserID().equals(mOwnerUserId);
                    mListener.onMemberEnter(userInfo);
                }
            }
        }

        @Override
        public void onMemberLeave(String groupID, V2TIMGroupMemberInfo member) {
            if (!groupID.equals(mRoomId)) {
                return;
            }
            if (mListener != null) {
                TXUserInfo userInfo = new TXUserInfo();
                userInfo.userId = member.getUserID();
                userInfo.userName = member.getNickName();
                userInfo.avatarURL = member.getFaceUrl();
                userInfo.isOwner = member.getUserID().equals(mOwnerUserId);
                mListener.onMemberLeave(userInfo);
            }
        }

        @Override
        public void onGroupDismissed(String groupID, V2TIMGroupMemberInfo opUser) {
            TRTCLogger.i(TAG, "receive room destroy msg");
            // 这里房主 IM 也会收到消息，但是由于我在 destroyGroup 成功的时候，把消息监听移除了，所以房主是不会走到这里的
            // 因此不需要做逻辑拦截。

            // 如果发现房间已经解散，那么内部退一次房间
            exitRoom(new TUIRoomCoreCallback.ActionCallback() {
                @Override
                public void onCallback(int code, String msg) {
                    TRTCLogger.i(TAG, "recv room destroy msg, exit room inner, code:" + code + " msg:" + msg);
                    // 无论结果是否成功，都清空状态，并且回调出去
                    String roomId = mRoomId;
                    cleanStatus();
                    ImServiceListener delegate = mListener;
                    if (delegate != null) {
                        delegate.onRoomDestroy(roomId);
                    }
                }
            });
        }

        @Override
        public void onGroupInfoChanged(String groupID, List<V2TIMGroupChangeInfo> changeInfos) {
            TRTCLogger.i(TAG, "onGroupInfoChanged");
            for (V2TIMGroupChangeInfo changeInfo : changeInfos) {
                if (changeInfo == null) {
                    continue;
                }
                TRTCLogger.i(TAG, "onGroupInfoChanged change type: " + changeInfo.getType());
                if (V2TIMGroupChangeInfo.V2TIM_GROUP_INFO_CHANGE_TYPE_NOTIFICATION == changeInfo.getType()) {
                    String value = changeInfo.getValue();
                    TRTCLogger.i(TAG, "onGroupInfoChanged changed notification: " + value);
                    GroupNotificationData groupNotificationData = SignalDataUtils.convert2GroupNotificationData(value);
                    onGroupNotificationDataChanged(groupNotificationData);
                } else if (V2TIMGroupChangeInfo.V2TIM_GROUP_INFO_CHANGE_TYPE_OWNER == changeInfo.getType()) {
                    String value = changeInfo.getValue();
                    TRTCLogger.i(TAG, "onGroupInfoChanged changed owner: " + value);
                    if (mListener != null) {
                        mListener.onRoomMasterChanged(mOwnerUserId, value);
                        mOwnerUserId = value;
                    }
                }
            }
        }

        @Override
        public void onReceiveJoinApplication(String groupID, V2TIMGroupMemberInfo member, String opReason) {
            TRTCLogger.i(TAG, "onReceiveJoinApplication userId:" + member.getUserID());
        }

        @Override
        public void onRevokeAdministrator(String groupID, V2TIMGroupMemberInfo opUser,
                                          List<V2TIMGroupMemberInfo> memberList) {
            TRTCLogger.i(TAG, "onRevokeAdministrator groupID:" + groupID);
        }
    }

    /**
     * 信令监听器
     */
    private V2TIMSignalingListener mTIMSignallingListener = new V2TIMSignalingListener() {
        @Override
        public void onReceiveNewInvitation(String inviteID, String inviter, String groupID,
                                           List<String> inviteeList, String data) {
            TRTCLogger.i(TAG, "onReceiveNewInvitation inviteID:" + inviteID + ", inviter:" + inviter
                    + ", groupID:" + groupID + ", inviteeList:" + inviteeList + " data:" + data);
            SignallingData signallingData = SignalDataUtils.convert2SignallingData(data);
            if (!isTUIRoomData(signallingData)) {
                TRTCLogger.e(TAG, "this is not the tuiroom sense ");
                return;
            }
            handleNewInvitation(inviteID, inviter, signallingData);
        }

        @Override
        public void onInviteeAccepted(String inviteID, String inviter, String data) {
            TRTCLogger.i(TAG, "onInviteeAccepted inviteID:" + inviteID
                    + ", inviter:" + inviter + " data:" + data);
            handleInvitation(inviteID, inviter, InvitationState.ACCEPT);
        }

        @Override
        public void onInviteeRejected(String inviteID, String inviter, String data) {
            TRTCLogger.i(TAG, "onInviteeRejected inviteID:" + inviteID
                    + ", inviter:" + inviter + " data:" + data);
            handleInvitation(inviteID, inviter, InvitationState.REJECT);
        }

        @Override
        public void onInvitationCancelled(String inviteID, String inviter, String data) {
            TRTCLogger.i(TAG, "onInvitationCancelled inviteID:" + inviteID + " data:" + data);
            handleInvitation(inviteID, inviter, InvitationState.CANCEL);
            onReceiveCancelCmd(inviteID, inviter);
        }

        @Override
        public void onInvitationTimeout(String inviteID, List<String> inviterList) {
            TRTCLogger.i(TAG, "onInvitationTimeout inviteID : " + inviteID);
            for (String inviter : inviterList) {
                handleInvitation(inviteID, inviter, InvitationState.TIMEOUT);
                onReceiveTimeoutCmd(inviteID, inviter);
            }
        }
    };
}
