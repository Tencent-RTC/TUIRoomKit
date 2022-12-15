package com.tencent.cloud.tuikit.roomkit.model;

import static com.tencent.liteav.debug.GenerateTestUserSig.XMAGIC_LICENSE_KEY;
import static com.tencent.liteav.debug.GenerateTestUserSig.XMAGIC_LICENSE_URL;

import android.content.Context;
import android.util.Log;
import android.view.View;

import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.cloud.tuikit.roomkit.presenter.IMeetingViewPresenter;
import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCCloudListener;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MeetingModel extends TUIRoomObserver {
    private static final String TAG = "MeetingModel";

    private static final int REQ_TIME_OUT = 15;

    private int                     mFps;
    private int                     mBitrate;
    private int                     mResolution;
    private String                  mRoomId;
    private String                  mSelfUserId;
    private boolean                 mIsFrontCamera;
    private boolean                 mEnableVideo;
    private boolean                 mEnableAudio;
    private boolean                 mIsOnSeat;
    private Context                 mContext;
    private TUIRoomEngine           mRoomEngine;
    private IMeetingViewPresenter   mPresenter;
    private List<UserEntity>        mUserEntityList;
    private Map<String, Object>     mBarrageRetMap;
    private Map<String, UserEntity> mUserEntityMap;


    public MeetingModel(Context context, IMeetingViewPresenter presenter, String roomId) {
        mContext = context;
        mPresenter = presenter;
        mRoomId = roomId;
        mIsFrontCamera = true;
        mRoomEngine = RoomEngineManager.sharedInstance(mContext).getRoomEngine(mRoomId);
        mBitrate = 1000;
        mPresenter = presenter;
        mResolution = TRTCCloudDef.TRTC_VIDEO_RESOLUTION_960_540;
        mSelfUserId = TUIRoomEngine.getSelfInfo().userId;
        mUserEntityList = new ArrayList<>();
        mUserEntityMap = new HashMap<>();
        setRoomOwner();

        mRoomEngine.addObserver(this);
        RoomInfo roomInfo = getRoomInfo();
        if (roomInfo != null) {
            mEnableVideo = roomInfo.enableVideo;
            mEnableAudio = roomInfo.enableAudio;
        }
    }

    public List<UserEntity> getUserEntityList() {
        return mUserEntityList;
    }

    public void enableMicrophone(boolean enable) {
        if (enable) {
            mRoomEngine.openLocalMicrophone(new TUIRoomDefine.ActionCallback() {
                @Override
                public void onSuccess() {
                    Log.i(TAG, "openLocalMicrophone success");
                }

                @Override
                public void onError(TUICommonDefine.Error code, String message) {
                    Log.e(TAG, "openLocalMicrophone onError code : " + code + " message:" + message);
                }
            });
            mRoomEngine.startPushLocalAudio();
        } else {
            if (!mEnableAudio) {
                mPresenter.disableMicrophoneButton(true);
            }
            mRoomEngine.stopPushLocalAudio();
            mRoomEngine.closeLocalMicrophone();
        }
    }

    public void enableCamera(final boolean enable) {
        if (enable) {
            mRoomEngine.openLocalCamera(mIsFrontCamera, new TUIRoomDefine.ActionCallback() {
                @Override
                public void onSuccess() {
                    Log.i(TAG, "openLocalMicrophone success");
                }

                @Override
                public void onError(TUICommonDefine.Error code, String message) {
                    Log.e(TAG, "openLocalMicrophone onError code : " + code + " message:" + message);
                }
            });
            mRoomEngine.startPushLocalVideo();
        } else {
            if (!mEnableVideo) {
                mPresenter.disableCameraButton(true);
            }
            mRoomEngine.stopPushLocalVideo();
            mRoomEngine.closeLocalCamera();
        }
    }

    private void enableBeautyProcess() {
        mRoomEngine.getTRTCCloud().setLocalVideoProcessListener(TRTCCloudDef.TRTC_VIDEO_PIXEL_FORMAT_Texture_2D,
                TRTCCloudDef.TRTC_VIDEO_BUFFER_TYPE_TEXTURE, new TRTCCloudListener.TRTCVideoFrameListener() {
                    @Override
                    public void onGLContextCreated() {

                    }

                    @Override
                    public int onProcessVideoFrame(TRTCCloudDef.TRTCVideoFrame trtcVideoFrame,
                                                   TRTCCloudDef.TRTCVideoFrame trtcVideoFrame1) {
                        Map<String, Object> map = new HashMap<>();
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_SRC_TEXTURE_ID, trtcVideoFrame.texture.textureId);
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_WIDTH, trtcVideoFrame.width);
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_HEIGHT, trtcVideoFrame.height);
                        if (TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, map) != null) {
                            trtcVideoFrame1.texture.textureId = (int) TUICore
                                    .callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                            TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, map);
                        } else {
                            trtcVideoFrame1.texture.textureId = trtcVideoFrame.texture.textureId;
                        }
                        return 0;
                    }

                    @Override
                    public void onGLContextDestory() {
                        TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                TUIConstants.TUIBeauty.METHOD_DESTROY_XMAGIC, null);
                    }
                });
    }

    public View getBeautyView() {
        Map<String, Object> map = new HashMap<>();
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_CONTEXT, mContext);
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_URL, XMAGIC_LICENSE_URL);
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_KEY, XMAGIC_LICENSE_KEY);
        TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME, TUIConstants.TUIBeauty.METHOD_INIT_XMAGIC, map);

        HashMap<String, Object> beautyParaMap = new HashMap<>();
        beautyParaMap.put("context", mContext);
        beautyParaMap.put("beautyManager", mRoomEngine.getBeautyManager());
        beautyParaMap.put("icon", R.drawable.tuiroomkit_ic_beauty);
        Map<String, Object> beautyRetMap = TUICore
                .getExtensionInfo("com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyButton",
                        beautyParaMap);
        if (beautyRetMap != null && beautyRetMap.size() > 0) {
            Object beautyVIew = beautyRetMap.get("TUIBeauty");
            if (beautyVIew instanceof View) {
                Log.i(TAG, "TUIBeauty TUIExtensionView getExtensionInfo success");
                // enableBeautyProcess();
                return (View) beautyVIew;
            } else {
                Log.e(TAG, "TUIBeauty TUIExtensionView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIBeauty getExtensionInfo null");
            return null;
        }
    }

    public View getVideoSeatView() {
        HashMap<String, Object> videoSeatParaMap = new HashMap<>();
        videoSeatParaMap.put("context", mContext);
        videoSeatParaMap.put("roomId", mRoomId);
        videoSeatParaMap.put("roomEngine", RoomEngineManager.sharedInstance(mContext).getRoomEngine(mRoomId));
        Map<String, Object> videoSeatRetMap = TUICore
                .getExtensionInfo("com.tencent.cloud.tuikit.videoseat.core.TUIVideoSeatExtension",
                        videoSeatParaMap);
        if (videoSeatRetMap != null && videoSeatRetMap.size() > 0) {
            Object videoSeatView = videoSeatRetMap.get("TUIVideoSeat");
            if (videoSeatView instanceof View) {
                Log.i(TAG, "TUIVideoSeat TUIExtensionView getExtensionInfo success");
                return ((View) videoSeatView);
            } else {
                Log.e(TAG, "TUIVideoSeat TUIExtensionView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIVideoSeat getExtensionInfo null");
            return null;
        }
    }

    private Map<String, Object> getBarrageRetMap() {
        HashMap<String, Object> barrageParaMap = new HashMap<>();
        barrageParaMap.put("context", mContext);
        barrageParaMap.put("groupId", mRoomId);
        barrageParaMap.put("roomEngine", mRoomEngine);
        barrageParaMap.put("icon", R.drawable.tuiroomkit_barrage_icon);
        mBarrageRetMap = TUICore.getExtensionInfo(
                "com.tencent.qcloud.tuikit.tuibarrage.core.TUIBarrageExtension", barrageParaMap);
        return mBarrageRetMap;
    }

    public View getBarrageSendView() {
        if (mBarrageRetMap == null || mBarrageRetMap.size() == 0) {
            mBarrageRetMap = getBarrageRetMap();
        }
        if (mBarrageRetMap != null && mBarrageRetMap.size() > 0) {
            Object barrageSendView = mBarrageRetMap.get("TUIBarrageButton");
            if (barrageSendView instanceof View) {
                Log.i(TAG, "TUIBarrage TUIBarrageButton getExtensionInfo success");
                return (View) barrageSendView;
            } else {
                Log.e(TAG, "TUIBarrage barrageSendView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIBarrage getExtensionInfo null");
            return null;
        }
    }

    public View getBarrageDisplayView() {
        if (mBarrageRetMap == null || mBarrageRetMap.size() == 0) {
            mBarrageRetMap = getBarrageRetMap();
        }
        if (mBarrageRetMap != null && mBarrageRetMap.size() > 0) {
            Object barrageDisplayView = mBarrageRetMap.get("TUIBarrageDisplayView");
            if (barrageDisplayView instanceof View) {
                Log.i(TAG, "TUIBarrage TUIBarrageDisplayView getExtensionInfo success");
                return ((View) barrageDisplayView);
            } else {
                Log.e(TAG, "TUIBarrage TUIBarrageDisplayView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIBarrage getExtensionInfo null");
            return null;
        }
    }

    public void switchCamera() {
        mIsFrontCamera = !mIsFrontCamera;
        mRoomEngine.getTRTCCloud().getDeviceManager().switchCamera(mIsFrontCamera);
    }

    public boolean isRoomOwner() {
        return RoomEngineManager.sharedInstance(mContext).isRoomOwner(mRoomId);
    }

    public void report() {
        RoomInfo roomInfo = RoomEngineManager.sharedInstance(mContext).getRoomInfo(mRoomId);
        if (roomInfo == null) {
            return;
        }
        try {
            Class clz = Class.forName("com.tencent.liteav.demo.report.ReportDialog");
            Method method = clz.getDeclaredMethod("showReportDialog", Context.class, String.class, String.class);
            method.invoke(null, this, String.valueOf(mRoomId), roomInfo.owner);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public RoomInfo getRoomInfo() {
        return RoomEngineManager.sharedInstance(mContext).getRoomInfo(mRoomId);
    }

    public void destroy() {
        TUIRoomEngine roomEngine = RoomEngineManager.sharedInstance(mContext).getRoomEngine(mRoomId);
        if (roomEngine != null) {
            roomEngine.removeObserver(this);
        }
        mUserEntityList = null;
        mUserEntityMap = null;
        mIsOnSeat = false;
    }

    private void addMemberEntity(UserEntity entity) {
        if (entity.getUserId().equals(mSelfUserId)) {
            return;
        }
        mUserEntityList.add(entity);
        mUserEntityMap.put(entity.getUserId(), entity);
        mPresenter.addRemoteUser(entity);
    }

    private void removeMemberEntity(String userId) {
        UserEntity entity = mUserEntityMap.remove(userId);
        mPresenter.removeRemoteUser(userId);
        if (entity != null) {
            mUserEntityList.remove(entity);
        }
    }

    public void muteUserAudio(String userId) {
        mRoomEngine.closeRemoteMicrophone(userId, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "closeRemoteMicrophone success");
                mPresenter.disableMuteAudio(true);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "closeRemoteMicrophone onError,error:" + error + ",msg:" + message);
            }
        });
    }

    public void muteUserVideo(String userId) {
        mRoomEngine.closeRemoteCamera(userId, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                Log.i(TAG, "closeRemoteCamera success");
                mPresenter.disableMuteVideo(true);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "closeRemoteCamera onError,error:" + error + ",msg:" + message);
            }
        });
    }

    public void muteAllUserAudio() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableAudio = false;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mPresenter.disableMuteAllAudio(true);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String message) {
                        Log.e(TAG, "updateRoomInfo onError error:" + error + ",msg:" + message);
                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "getRoomInfo onError error:" + error + "msg:" + message);
            }
        });
    }

    public void muteAllUserVideo() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableVideo = false;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mPresenter.disableMuteAllVideo(true);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String message) {
                        Log.e(TAG, "updateRoomInfo onError error:" + error + "msg:" + message);
                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String message) {
                Log.e(TAG, "getRoomInfo onError error:" + error + "msg:" + message);
            }
        });
    }

    public void unMuteUserAudio(String userId) {
        mRoomEngine.requestToOpenRemoteMicrophone(userId, REQ_TIME_OUT, new TUIRoomDefine.RequestCallback() {
            @Override
            public void onAccepted(int i, String s) {
                mPresenter.disableMuteAudio(false);
            }

            @Override
            public void onRejected(int i, String s, String s1) {

            }

            @Override
            public void onCancelled(int requestId, String userId) {

            }

            @Override
            public void onTimeout(int i, String s) {

            }

            @Override
            public void onError(int i, String s, TUICommonDefine.Error error, String s1) {

            }
        });
    }

    public void unMuteUserVideo(String userId) {
        mRoomEngine.requestToOpenRemoteCamera(userId, REQ_TIME_OUT, new TUIRoomDefine.RequestCallback() {
            @Override
            public void onAccepted(int i, String s) {
                mPresenter.disableMuteVideo(false);
            }

            @Override
            public void onRejected(int i, String s, String s1) {

            }

            @Override
            public void onCancelled(int requestId, String userId) {

            }

            @Override
            public void onTimeout(int i, String s) {

            }

            @Override
            public void onError(int i, String s, TUICommonDefine.Error error, String s1) {

            }
        });
    }


    public void unMuteAllUserAudio() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableAudio = true;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mPresenter.disableMuteAllAudio(false);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {

                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }


    public void unMuteAllUserVideo() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                roomInfo.enableVideo = true;
                mRoomEngine.updateRoomInfo(roomInfo, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mPresenter.disableMuteAllVideo(false);
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {

                    }
                });
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }


    public void kickUser(String userId, final TUIRoomDefine.ActionCallback callback) {
        mRoomEngine.kickOutRemoteUser(userId, new TUIRoomDefine.ActionCallback() {
            @Override
            public void onSuccess() {
                callback.onSuccess();
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {
                callback.onError(error, s);
            }
        });
    }


    private void setRoomOwner() {
        mRoomEngine.getRoomInfo(new TUIRoomDefine.GetRoomInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.RoomInfo roomInfo) {
                mPresenter.setRoomOwner(mSelfUserId.equals(roomInfo.owner));
                mRoomEngine.getSeatList(new TUIRoomDefine.GetSeatListCallback() {
                    @Override
                    public void onSuccess(List<TUIRoomDefine.SeatInfo> list) {
                        for (TUIRoomDefine.SeatInfo seatInfo : list) {
                            if (mSelfUserId.equals(seatInfo.userId)) {
                                continue;
                            }
                            mRoomEngine.getUserInfo(seatInfo.userId, new TUIRoomDefine.GetUserInfoCallback() {
                                @Override
                                public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                                    UserEntity entity = new UserEntity();
                                    entity.setUserId(userInfo.userId);
                                    entity.setUserName(userInfo.userName);
                                    entity.setUserAvatar(userInfo.avatarUrl);
                                    entity.setAudioAvailable(userInfo.hasAudioStream);
                                    entity.setVideoAvailable(userInfo.hasVideoStream);
                                    entity.setRole(userInfo.userRole);
                                    addMemberEntity(entity);
                                    mPresenter.updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                                            userInfo.avatarUrl);
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
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }


    public void setVideoBitrate(int bitrate) {
        if (bitrate == mBitrate) {
            return;
        }
        mBitrate = bitrate;
        setVideoEncoderParam();
    }

    private void setVideoEncoderParam() {
        TRTCCloudDef.TRTCVideoEncParam param = new TRTCCloudDef.TRTCVideoEncParam();
        param.videoResolution = mResolution;
        param.videoBitrate = mBitrate;
        param.videoFps = mFps;
        param.enableAdjustRes = true;
        param.videoResolutionMode = TRTCCloudDef.TRTC_VIDEO_RESOLUTION_MODE_PORTRAIT;
        mRoomEngine.getTRTCCloud().setVideoEncoderParam(param);
    }

    public void setVideoResolution(int resolution) {
        if (resolution == mResolution) {
            return;
        }
        mResolution = resolution;
        setVideoEncoderParam();
    }


    public void setVideoFps(int fps) {
        if (fps == mFps) {
            return;
        }
        mFps = fps;
        setVideoEncoderParam();
    }


    public void setVideoMirror(boolean enable) {
        TRTCCloudDef.TRTCRenderParams param = new TRTCCloudDef.TRTCRenderParams();
        param.mirrorType = enable ? TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_ENABLE
                : TRTCCloudDef.TRTC_VIDEO_MIRROR_TYPE_DISABLE;
        mRoomEngine.getTRTCCloud().setLocalRenderParams(param);
    }


    public void setAudioCaptureVolume(int volume) {
        mRoomEngine.getTRTCCloud().setAudioCaptureVolume(volume);
    }


    public void setAudioPlayVolume(int volume) {
        mRoomEngine.getTRTCCloud().setAudioPlayoutVolume(volume);
    }


    public void enableAudioEvaluation(boolean enable) {
        mRoomEngine.getTRTCCloud().enableAudioVolumeEvaluation(enable ? 300 : 0, enable);
    }


    public void startFileDumping(String filePath) {
        TRTCCloudDef.TRTCAudioRecordingParams params = new TRTCCloudDef.TRTCAudioRecordingParams();
        params.filePath = filePath;
        mRoomEngine.getTRTCCloud().startAudioRecording(params);
    }


    public void stopFileDumping() {
        mRoomEngine.getTRTCCloud().stopAudioRecording();
    }

    public void startScreenShare() {
        mRoomEngine.closeLocalCamera();
        mRoomEngine.startScreenSharing();
    }

    public void stopScreenShare() {
        mRoomEngine.stopScreenSharing();
    }

    public void setAudioRoute(boolean isUseSpeaker) {
        mRoomEngine.getTRTCCloud().setAudioRoute(isUseSpeaker ? TRTCCloudDef.TRTC_AUDIO_ROUTE_SPEAKER
                : TRTCCloudDef.TRTC_AUDIO_ROUTE_EARPIECE);
    }

    private void changeResolution(List<TUIRoomDefine.SeatInfo> seatList) {
        TRTCCloudDef.TRTCNetworkQosParam qosParam = new TRTCCloudDef.TRTCNetworkQosParam();
        qosParam.preference = TRTCCloudDef.TRTC_VIDEO_QOS_PREFERENCE_CLEAR;
        mRoomEngine.getTRTCCloud().setNetworkQosParam(qosParam);
        if (seatList.size() <= 2) {
            setVideoResolution(TRTCCloudDef.TRTC_VIDEO_RESOLUTION_960_540);
            setVideoFps(15);
            setVideoBitrate(1300);
        } else if (seatList.size() < 4) {
            setVideoResolution(TRTCCloudDef.TRTC_VIDEO_RESOLUTION_640_360);
            setVideoFps(15);
            setVideoBitrate(800);
        } else {
            setVideoResolution(TRTCCloudDef.TRTC_VIDEO_RESOLUTION_480_270);
            setVideoFps(15);
            setVideoBitrate(400);
        }
    }

    private void updateUserEntityList(TUIRoomDefine.SeatInfo info) {
        String userId = info.userId;
        final UserEntity entity = new UserEntity();
        entity.setUserId(userId);
        addMemberEntity(entity);
        mRoomEngine.getUserInfo(userId, new TUIRoomDefine.GetUserInfoCallback() {
            @Override
            public void onSuccess(TUIRoomDefine.UserInfo userInfo) {
                entity.setUserName(userInfo.userName);
                entity.setUserAvatar(userInfo.avatarUrl);
                entity.setRole(userInfo.userRole);
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
                mPresenter.updateRemoteUserInfo(userInfo.userId, userInfo.userName,
                        userInfo.avatarUrl);
            }

            @Override
            public void onError(TUICommonDefine.Error error, String s) {

            }
        });
    }

    @Override
    public void onUserVideoStateChanged(String userId,
                                        TUIRoomDefine.VideoStreamType videoStreamType,
                                        boolean available,
                                        TUIRoomDefine.ChangeReason changeReason) {
        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(videoStreamType)) {
            mPresenter.enableShareButton(true);
            return;
        }
        mPresenter.updateRemoteUserVideo(userId, available);
        if (mSelfUserId.equals(userId)
                && !TUIRoomDefine.ChangeReason.BY_SELF.equals(changeReason)) {
            mPresenter.onCameraMuted(!available);
            if (!mEnableVideo) {
                mPresenter.disableCameraButton(true);
            }
        }
    }

    @Override
    public void onUserAudioStateChanged(String userId, boolean available,
                                        TUIRoomDefine.ChangeReason changeReason) {
        mPresenter.updateRemoteUserAudio(userId, available);
        if (mSelfUserId.equals(userId)
                && !TUIRoomDefine.ChangeReason.BY_SELF.equals(changeReason)) {
            mPresenter.onMicrophoneMuted(!available);
            if (!mEnableAudio) {
                mPresenter.disableMicrophoneButton(true);
            }
        }
    }

    @Override
    public void onSeatListChanged(List<TUIRoomDefine.SeatInfo> seatList,
                                  List<TUIRoomDefine.SeatInfo> userSeatedList,
                                  List<TUIRoomDefine.SeatInfo> userLeftList) {
        changeResolution(seatList);
        for (TUIRoomDefine.SeatInfo info :
                userSeatedList) {
            updateUserEntityList(info);
        }
        for (TUIRoomDefine.SeatInfo info :
                userLeftList) {
            removeMemberEntity(info.userId);
        }
    }

    @Override
    public void onRequestReceived(TUIRoomDefine.Request request) {
        switch (request.requestAction) {
            case REQUEST_TO_OPEN_REMOTE_MICROPHONE:
                mRoomEngine.responseRemoteRequest(request.requestId, true, null);
                mPresenter.disableMicrophoneButton(false);
                break;
            case REQUEST_TO_OPEN_REMOTE_CAMERA:
                mRoomEngine.responseRemoteRequest(request.requestId, true, null);
                mPresenter.disableCameraButton(false);
                break;
            default:
                break;
        }
    }

    @Override
    public void onRoomInfoChanged(String roomId, TUIRoomDefine.RoomInfo roomInfo) {
        Log.i(TAG, "onRoomInfoChanged " + roomId + " roomInfo: " + roomInfo);
        if (!roomInfo.roomId.equals(mRoomId)) {
            return;
        }
        if (isRoomOwner()) {
            mPresenter.setRoomOwner(true);
            return;
        }
        boolean enableVideo = roomInfo.enableVideo;
        if (enableVideo != mEnableVideo) {
            if (!enableVideo) {
                mRoomEngine.closeLocalCamera();
            }
            mPresenter.disableMuteAllVideo(!roomInfo.enableVideo);
            mPresenter.disableCameraButton(!enableVideo);
            mEnableVideo = enableVideo;
        }
        boolean enableAudio = roomInfo.enableAudio;
        if (enableAudio != mEnableAudio) {
            if (!enableAudio) {
                mRoomEngine.closeLocalMicrophone();
            }
            mPresenter.disableMuteAllAudio(!roomInfo.enableAudio);
            mPresenter.disableMicrophoneButton(!enableAudio);
            mEnableAudio = enableAudio;
        }
    }

    @Override
    public void onUserScreenCaptureStopped(int reason) {
        if (mEnableVideo) {
            mRoomEngine.openLocalCamera(mIsFrontCamera, null);
        }
    }
}
