package com.tencent.cloud.tuikit.videoseat.model;

import android.content.Context;
import android.util.Log;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.videoseat.presenter.VideoSeatPresenter;
import com.tencent.cloud.tuikit.videoseat.ui.utils.UserListAdapter;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class VideoSeatModel extends TUIRoomObserver implements IVideoSeatModel {
    private static final String TAG = "VideoSeatEngineService";

    private String                  mRoomId;
    private String                  mUserId;
    private Context                 mContext;
    private TUIRoomEngine           mRoomEngine;
    private VideoSeatPresenter      mPresenter;
    private List<UserEntity>        mUserEntityList;
    private Map<String, UserEntity> mUserEntityMap;

    public VideoSeatModel(Context context,
                          String roomId,
                          TUIRoomEngine roomEngine,
                          VideoSeatPresenter presenter) {
        mContext = context;
        mPresenter = presenter;
        mRoomId = roomId;
        mRoomEngine = roomEngine;
        mUserEntityList = new ArrayList<>();
        mUserEntityMap = new HashMap<>();
        mRoomEngine.addObserver(this);
        initData();
    }

    public List<UserEntity> getData() {
        return mUserEntityList;
    }

    private void initSelfEntity() {
        TUIRoomDefine.UserInfo selfInfo = TUIRoomEngine.getSelfInfo();
        mUserId = selfInfo.userId;
        VideoView selfVideoView = new VideoView(mContext);
        selfVideoView.setUserId(mUserId);
        selfVideoView.setSelfView(true);
        final UserEntity selfEntity = new UserEntity();
        selfEntity.setRoomVideoView(selfVideoView);
        selfEntity.setUserId(mUserId);
        selfEntity.setUserName(selfInfo.userName);
        selfEntity.setUserAvatar(selfInfo.avatarUrl);
        selfEntity.setSelf(true);
        selfEntity.setRole(TUIRoomDefine.Role.GENERAL_USER);
        addMemberEntity(selfEntity);
        mPresenter.notifyItemInserted(mUserEntityList.size());
        mRoomEngine.setLocalVideoView(TUIRoomDefine.VideoStreamType.CAMERA_STREAM,
                selfVideoView.getLocalPreviewView());
        mRoomEngine.getUserInfo(mUserId, new TUIRoomDefine.GetUserInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                selfEntity.setUserName(userInfo.userName);
                selfEntity.setUserAvatar(userInfo.avatarUrl);
                selfEntity.setRole(userInfo.userRole);
                selfEntity.setCameraAvailable(userInfo.hasVideoStream);
                selfEntity.setAudioAvailable(userInfo.hasAudioStream);
                selfEntity.setScreenShareAvailable(userInfo.hasScreenStream);
                boolean isVideoAvailable = selfEntity.isScreenShareAvailable() || selfEntity.isCameraAvailable();
                selfEntity.setVideoAvailable(isVideoAvailable);
                boolean isChangeSort = selfEntity.getRole() == TUIRoomDefine.Role.ROOM_OWNER;
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
                mPresenter.notifyItemChanged(mUserEntityList.indexOf(selfEntity), isChangeSort);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    private void initData() {
        initSelfEntity();

        mRoomEngine.getSeatList(new TUIRoomDefine.GetSeatListCallback() {
            @Override
            public void onSuccess(List<TUIRoomDefine.SeatInfo> list) {
                if (list.isEmpty()) {
                    return;
                }
                for (TUIRoomDefine.SeatInfo info : list) {
                    if (mUserId.equals(info.userId)) {
                        continue;
                    }
                    if (mUserEntityMap.containsKey(info.userId)) {
                        return;
                    }
                    final int insertIndex = mUserEntityList.size();
                    final VideoView roomVideoView = new VideoView(mContext);
                    roomVideoView.setUserId(info.userId);
                    final UserEntity entity = new UserEntity();
                    entity.setUserId(info.userId);
                    entity.setSelf(false);
                    entity.setRoomVideoView(roomVideoView);
                    addMemberEntity(entity);
                    mPresenter.notifyItemInserted(insertIndex);
                    mRoomEngine.getUserInfo(info.userId, new TUIRoomDefine.GetUserInfoCallback() {
                        @Override
                        public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                            entity.setUserName(userInfo.userName);
                            entity.setUserAvatar(userInfo.avatarUrl);
                            entity.setRole(userInfo.userRole);
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
                            mPresenter.notifyItemChanged(mUserEntityList.indexOf(entity), isChangeSort);
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


    private void addMemberEntity(UserEntity entity) {
        if (mUserEntityMap.containsKey(entity.getUserId())) {
            return;
        }
        mUserEntityList.add(entity);
        mUserEntityMap.put(entity.getUserId(), entity);
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
            mPresenter.notifyItemChanged(mUserEntityList.indexOf(entity), UserListAdapter.QUALITY);
        }
    }

    @Override
    public void onUserVideoStateChanged(String userId,
                                        TUIRoomDefine.VideoStreamType videoStreamType,
                                        boolean available, TUIRoomDefine.ChangeReason changeReason) {
        Log.d(TAG, "onUserVideoStateChanged userId: " + userId
                + " available: " + available + ",type:" + videoStreamType);
        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(videoStreamType)) {
            if (available && mPresenter.isScreenShare()) {
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
                if (mPresenter != null) {
                    mPresenter.notifyScreenShare(available, entity);
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
            mPresenter.notifyItemChanged(mUserEntityList.indexOf(entity));
        }
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
                    mPresenter.notifyItemChanged(mUserEntityList.indexOf(memberEntity),
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
            addMemberEntity(entity);
            mPresenter.notifyItemInserted(insertIndex);
            mRoomEngine.getUserInfo(userId, new TUIRoomDefine.GetUserInfoCallback() {
                @Override
                public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                    entity.setUserName(userInfo.userName);
                    entity.setUserAvatar(userInfo.avatarUrl);
                    entity.setRole(userInfo.userRole);
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
                    mPresenter.notifyItemChanged(mUserEntityList.indexOf(entity), isChangeSort);
                }

                @Override
                public void onError(TUICommonDefine.Error error, String s) {

                }
            });
        }
        for (TUIRoomDefine.SeatInfo info : userLeftList) {
            int index = removeMemberEntity(info.userId);
            if (index >= 0) {
                mPresenter.notifyItemRemoved(index, info.userId);
            }
        }
    }

    @Override
    public void onRoomInfoChanged(String roomId, TUIRoomDefine.RoomInfo roomInfo) {
        if (!mUserEntityMap.containsKey(mUserId)) {
            return;
        }
        UserEntity entity = mUserEntityMap.get(mUserId);
        if (TUIRoomDefine.Role.ROOM_OWNER.equals(entity.getRole())) {
            return;
        }
        if (roomInfo.owner.equals(mUserId)) {
            entity.setRole(TUIRoomDefine.Role.ROOM_OWNER);
            int position = mUserEntityList.indexOf(entity);
            mPresenter.notifyItemChanged(position);
        }
    }
}
