package com.tencent.cloud.tuikit.videoseat.viewmodel;

import android.content.Context;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.videoseat.ui.TUIVideoSeatView;
import com.tencent.cloud.tuikit.videoseat.ui.utils.UserListAdapter;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VideoSeatViewModel extends TUIRoomObserver implements IVideoSeatViewModel {
    private static final String TAG = "VideoSeatViewModel";

    private TUIVideoSeatView mVideoSeatView;

    private String                  mRoomId;
    private String                  mUserId;
    private String                  mOwnerId;
    private Context                 mContext;
    private TUIRoomEngine           mRoomEngine;
    private List<UserEntity>        mUserEntityList;
    private Map<String, UserEntity> mUserEntityMap;


    public VideoSeatViewModel(Context context,
                              TUIRoomEngine roomEngine,
                              TUIVideoSeatView videoSeatView,
                              String roomId) {
        mVideoSeatView = videoSeatView;
        mRoomEngine = roomEngine;
        mUserId = TUIRoomEngine.getSelfInfo().userId;
        mRoomId = roomId;
        mContext = context;

        mUserEntityList = new ArrayList<>();
        mUserEntityMap = new HashMap<>();
        mVideoSeatView.setMemberEntityList(mUserEntityList);
        mRoomEngine.addObserver(this);
        getSeatList();
    }

    @Override
    public void destroy() {
        mRoomEngine.removeObserver(this);
        mUserEntityList.clear();
        mUserEntityMap.clear();
    }

    @Override
    public void startPlayVideo(String userId, TUIVideoView videoView, boolean isSharingScreen) {
        TUIRoomDefine.VideoStreamType videoStreamType;
        if (isSharingScreen) {
            videoStreamType = TUIRoomDefine.VideoStreamType.SCREEN_STREAM;
        } else {
            videoStreamType = TUIRoomDefine.VideoStreamType.CAMERA_STREAM;
        }
        mRoomEngine.setRemoteVideoView(userId, videoStreamType, videoView);
        mRoomEngine.startPlayRemoteVideo(userId, videoStreamType, null);

    }

    @Override
    public void stopPlayVideo(String userId, boolean isSharingScreen, boolean isStreamStop) {
        TUIRoomDefine.VideoStreamType videoStreamType;
        if (isSharingScreen) {
            videoStreamType = TUIRoomDefine.VideoStreamType.SCREEN_STREAM;
        } else {
            videoStreamType = TUIRoomDefine.VideoStreamType.CAMERA_STREAM;
        }
        UserEntity entity = mUserEntityMap.get(userId);
        if (entity != null) {
            entity.getRoomVideoView().setPlayingWithoutSetVisible(false);
            mRoomEngine.stopPlayRemoteVideo(userId, videoStreamType);
        }
    }

    @Override
    public List<UserEntity> getData() {
        return mUserEntityList;
    }


    @Override
    public void onUserVideoStateChanged(String userId,
                                        TUIRoomDefine.VideoStreamType videoStreamType,
                                        boolean available, TUIRoomDefine.ChangeReason changeReason) {
        Log.d(TAG, "onUserVideoStateChanged userId: " + userId
                + " available: " + available + ",type:" + videoStreamType);
        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(videoStreamType)) {
            if (available && mVideoSeatView.isShareScreen()) {
                Log.d(TAG, "in screen capture， ignore");
                return;
            }
            final UserEntity entity = mUserEntityMap.get(userId);
            if (entity != null) {
                entity.setScreenShareAvailable(available);
                boolean isVideoAvailable = entity.isScreenShareAvailable() || entity.isCameraAvailable();
                if (isVideoAvailable) {
                    final VideoView roomVideoView = new VideoView(mContext);
                    roomVideoView.enableScale(available);
                    roomVideoView.setUserId(userId);
                    entity.setRoomVideoView(roomVideoView);
                }
                entity.setNeedFresh(true);
                entity.setVideoAvailable(isVideoAvailable);
                if (mVideoSeatView != null) {
                    mVideoSeatView.notifyScreenShare(available, entity);
                }
            }
        } else if (TUIRoomDefine.VideoStreamType.CAMERA_STREAM.equals(videoStreamType)) {
            UserEntity entity = mUserEntityMap.get(userId);
            if (entity == null) {
                return;
            }
            entity.setCameraAvailable(available);
            if (entity.isScreenShareAvailable()) {
                Log.d(TAG, "camera available in screen capture， ignore");
                return;
            }
            entity.setNeedFresh(true);
            boolean isVideoAvailable = entity.isScreenShareAvailable() || entity.isCameraAvailable();
            entity.setVideoAvailable(isVideoAvailable);
            mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(entity));
        }
    }

    @Override
    public void onUserAudioStateChanged(String userId, boolean hasAudio, TUIRoomDefine.ChangeReason reason) {
        UserEntity entity = mUserEntityMap.get(userId);
        if (entity == null) {
            return;
        }
        entity.setNeedFresh(true);
        entity.setAudioAvailable(hasAudio);
        mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(entity));
    }

    @Override
    public void onUserVoiceVolumeChanged(Map<String, Integer> map) {
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            String userId = "".equals(entry.getKey()) ? mUserId : entry.getKey();
            UserEntity memberEntity = mUserEntityMap.get(userId);
            if (memberEntity != null) {
                memberEntity.setAudioVolume(entry.getValue());
                boolean change = false;
                if (memberEntity.getAudioVolume() > 15) {
                    if (!memberEntity.isTalk()) {
                        memberEntity.setTalk(true);
                        change = true;
                    }
                } else {
                    if (memberEntity.isTalk()) {
                        memberEntity.setTalk(false);
                        change = true;
                    }
                }
                if (change) {
                    mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(memberEntity),
                            UserListAdapter.VOLUME);
                }
            }
        }
    }

    @Override
    public void onUserNetworkQualityChanged(Map<String, TUICommonDefine.NetworkInfo> map) {
        for (Map.Entry<String, TUICommonDefine.NetworkInfo> entry : map.entrySet()) {
            matchQuality(entry.getValue(), mUserEntityMap.get(entry.getKey()));
        }
    }

    private void matchQuality(TUICommonDefine.NetworkInfo networkInfo, UserEntity entity) {
        if (entity == null) {
            return;
        }
        int oldQuality = entity.getQuality();
        switch (networkInfo.quality) {
            case EXCELLENT:
            case GOOD:
                entity.setQuality(UserEntity.QUALITY_GOOD);
                break;
            case VERY_BAD:
            case DOWN:
                entity.setQuality(UserEntity.QUALITY_BAD);
                break;
            default:
                entity.setQuality(UserEntity.QUALITY_NORMAL);
                break;
        }
        if (oldQuality != entity.getQuality()) {
            mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(entity), UserListAdapter.QUALITY);
        }
    }

    @Override
    public void onSeatListChanged(List<TUIRoomDefine.SeatInfo> seatList,
                                  List<TUIRoomDefine.SeatInfo> userSeatedList,
                                  List<TUIRoomDefine.SeatInfo> userLeftList) {
        for (TUIRoomDefine.SeatInfo info : userSeatedList) {
            String userId = info.userId;
            if (mUserEntityMap.containsKey(userId)) {
                continue;
            }
            final UserEntity entity = new UserEntity();
            entity.setUserId(userId);
            final int insertIndex = mUserEntityList.size();
            final VideoView roomVideoView = new VideoView(mContext);
            roomVideoView.setUserId(userId);
            entity.setRoomVideoView(roomVideoView);
            if (info.userId.equals(mUserId)) {
                entity.setSelf(true);
                roomVideoView.setSelfView(true);
                mRoomEngine.setLocalVideoView(TUIRoomDefine.VideoStreamType.CAMERA_STREAM,
                        roomVideoView.getLocalPreviewView());

            }
            addMemberEntity(entity);
            mVideoSeatView.notifyItemInserted(insertIndex);
            mRoomEngine.getUserInfo(userId, new TUIRoomDefine.GetUserInfoCallback() {
                @Override
                public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                    entity.setUserName(userInfo.userName);
                    entity.setUserAvatar(userInfo.avatarUrl);
                    entity.setRole(userInfo.userRole);
                    if (TUIRoomDefine.Role.ROOM_OWNER.equals(userInfo.userRole)) {
                        mOwnerId = entity.getUserId();
                    }
                    entity.setScreenShareAvailable(userInfo.hasScreenStream);
                    entity.setAudioAvailable(userInfo.hasAudioStream);
                    entity.setCameraAvailable(userInfo.hasVideoStream);
                    entity.setNeedFresh(true);
                    boolean isVideoAvailable = entity.isScreenShareAvailable() || entity.isCameraAvailable();
                    entity.setVideoAvailable(isVideoAvailable);
                    boolean isChangeSort = entity.getRole() == TUIRoomDefine.Role.ROOM_OWNER;
                    if (isChangeSort) {
                        Collections.sort(mUserEntityList, new Comparator<UserEntity>() {
                            @Override
                            public int compare(UserEntity o1, UserEntity o2) {
                                if (o1.getRole() == TUIRoomDefine.Role.ROOM_OWNER) {
                                    return -1;
                                }
                                return 1;
                            }
                        });
                    }
                    mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(entity), isChangeSort);
                }

                @Override
                public void onError(TUICommonDefine.Error error, String s) {

                }
            });
        }
        for (TUIRoomDefine.SeatInfo info : userLeftList) {
            int index = removeMemberEntity(info.userId);
            if (index >= 0) {
                mVideoSeatView.notifyItemRemoved(index, info.userId);
            }
        }
    }

    private int removeMemberEntity(String userId) {
        UserEntity entity = mUserEntityMap.remove(userId);
        if (entity != null) {
            int i = mUserEntityList.indexOf(entity);
            mUserEntityList.remove(entity);
            return i;
        }
        return -1;
    }

    @Override
    public void onRoomInfoChanged(String roomId, TUIRoomDefine.RoomInfo roomInfo) {
        if (roomInfo.owner.equals(mOwnerId)) {
            return;
        }
        UserEntity newOwner = mUserEntityMap.get(roomInfo.owner);
        if (newOwner == null) {
            return;
        }
        UserEntity oldOwner = mUserEntityMap.get(mOwnerId);
        if (oldOwner == null) {
            return;
        }
        newOwner.setRole(TUIRoomDefine.Role.ROOM_OWNER);
        oldOwner.setRole(TUIRoomDefine.Role.GENERAL_USER);

        int oldOwnerPosition = mUserEntityList.indexOf(oldOwner);
        int newOwnerPosition = mUserEntityList.indexOf(newOwner);
        mVideoSeatView.notifyItemChanged(oldOwnerPosition);
        mVideoSeatView.notifyItemChanged(newOwnerPosition);
        mOwnerId = roomInfo.owner;
    }

    private void getSeatList() {
        mRoomEngine.getSeatList(new TUIRoomDefine.GetSeatListCallback() {
            @Override
            public void onSuccess(List<TUIRoomDefine.SeatInfo> list) {
                if (list.isEmpty()) {
                    return;
                }
                for (TUIRoomDefine.SeatInfo info : list) {
                    if (mUserEntityMap.containsKey(info.userId)) {
                        return;
                    }
                    final int insertIndex = mUserEntityList.size();
                    final VideoView roomVideoView = new VideoView(mContext);
                    roomVideoView.setUserId(info.userId);
                    final UserEntity entity = new UserEntity();
                    entity.setUserId(info.userId);
                    if (info.userId.equals(mUserId)) {
                        entity.setSelf(true);
                        roomVideoView.setSelfView(true);
                        mRoomEngine.setLocalVideoView(TUIRoomDefine.VideoStreamType.CAMERA_STREAM,
                                roomVideoView.getLocalPreviewView());
                    }

                    entity.setRoomVideoView(roomVideoView);
                    addMemberEntity(entity);
                    mVideoSeatView.notifyItemInserted(insertIndex);
                    mRoomEngine.getUserInfo(info.userId, new TUIRoomDefine.GetUserInfoCallback() {
                        @Override
                        public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                            entity.setUserName(userInfo.userName);
                            entity.setUserAvatar(userInfo.avatarUrl);
                            entity.setRole(userInfo.userRole);
                            if (TUIRoomDefine.Role.ROOM_OWNER.equals(userInfo.userRole)) {
                                mOwnerId = entity.getUserId();
                            }
                            entity.setNeedFresh(true);
                            entity.setScreenShareAvailable(userInfo.hasScreenStream);
                            entity.setAudioAvailable(userInfo.hasAudioStream);
                            entity.setCameraAvailable(userInfo.hasVideoStream);
                            boolean isVideoAvailable = entity.isScreenShareAvailable() || entity.isCameraAvailable();
                            entity.setVideoAvailable(isVideoAvailable);
                            boolean isChangeSort = entity.getRole() == TUIRoomDefine.Role.ROOM_OWNER;
                            if (isChangeSort) {
                                Collections.sort(mUserEntityList, new Comparator<UserEntity>() {
                                    @Override
                                    public int compare(UserEntity o1, UserEntity o2) {
                                        if (o1.getRole() == TUIRoomDefine.Role.ROOM_OWNER) {
                                            return -1;
                                        }
                                        return 1;
                                    }
                                });
                            }
                            mVideoSeatView.notifyItemChanged(mUserEntityList.indexOf(entity), isChangeSort);
                        }

                        @Override
                        public void onError(TUICommonDefine.Error error, String s) {

                        }
                    });
                }
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    private void addMemberEntity(UserEntity entity) {
        if (mUserEntityMap.containsKey(entity.getUserId())) {
            return;
        }
        mUserEntityList.add(entity);
        mUserEntityMap.put(entity.getUserId(), entity);
    }
}