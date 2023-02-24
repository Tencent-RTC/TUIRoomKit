package com.tencent.cloud.tuikit.roomkit.viewmodel;

import android.content.Context;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.model.RoomStore;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.view.component.SettingView;
import com.tencent.trtc.TRTCCloudDef;

import java.util.Map;

public class SettingViewModel implements RoomEventCenter.RoomEngineEventResponder {
    private static final int VOLUME_PROMPT_INTERVAL = 300;

    private RoomStore     mRoomStore;
    private TUIRoomEngine mRoomEngine;
    private SettingView   mSettingView;

    public SettingViewModel(Context context, SettingView settingView) {
        mSettingView = settingView;
        RoomEngineManager engineManager = RoomEngineManager.sharedInstance(context);
        mRoomEngine = engineManager.getRoomEngine();
        mRoomStore = engineManager.getRoomStore();
        RoomEventCenter.getInstance().subscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
    }

    public void destroy() {
        RoomEventCenter.getInstance().unsubscribeEngine(RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED, this);
    }

    public void setVideoBitrate(int bitrate) {
        if (bitrate == mRoomStore.videoModel.bitrate) {
            return;
        }
        mRoomStore.videoModel.bitrate = bitrate;
        setVideoEncoderParam();
    }

    private void setVideoEncoderParam() {
        TRTCCloudDef.TRTCVideoEncParam param = new TRTCCloudDef.TRTCVideoEncParam();
        param.videoResolution = mRoomStore.videoModel.resolution;
        param.videoBitrate = mRoomStore.videoModel.bitrate;
        param.videoFps = mRoomStore.videoModel.fps;
        param.enableAdjustRes = true;
        param.videoResolutionMode = TRTCCloudDef.TRTC_VIDEO_RESOLUTION_MODE_PORTRAIT;
        mRoomEngine.getTRTCCloud().setVideoEncoderParam(param);
    }

    public void setVideoResolution(int resolution) {
        if (resolution == mRoomStore.videoModel.resolution) {
            return;
        }
        mRoomStore.videoModel.resolution = resolution;
        setVideoEncoderParam();
    }

    public void setVideoFps(int fps) {
        if (fps == mRoomStore.videoModel.fps) {
            return;
        }
        mRoomStore.videoModel.fps = fps;
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

    public void startScreenShare() {
        RoomEventCenter.getInstance().notifyUIEvent(RoomEventCenter.RoomKitUIEvent.START_SCREEN_SHARE, null);
    }

    public void enableAudioEvaluation(boolean enable) {
        mRoomEngine.getTRTCCloud().enableAudioVolumeEvaluation(enable ? VOLUME_PROMPT_INTERVAL : 0, enable);
    }

    public void startFileDumping(String filePath) {
        TRTCCloudDef.TRTCAudioRecordingParams params = new TRTCCloudDef.TRTCAudioRecordingParams();
        params.filePath = filePath;
        mRoomEngine.getTRTCCloud().startAudioRecording(params);
    }

    public void stopFileDumping() {
        mRoomEngine.getTRTCCloud().stopAudioRecording();
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        if (RoomEventCenter.RoomEngineEvent.USER_VIDEO_STATE_CHANGED.equals(event)) {
            onUserVideoStateChanged(params);
        }
    }

    private void onUserVideoStateChanged(Map<String, Object> params) {
        if (params == null) {
            return;
        }

        TUIRoomDefine.VideoStreamType videoStreamType = (TUIRoomDefine.VideoStreamType)
                params.get(RoomEventConstant.KEY_STREAM_TYPE);

        if (TUIRoomDefine.VideoStreamType.SCREEN_STREAM.equals(videoStreamType)) {
            boolean available = (boolean) params.get(RoomEventConstant.KEY_HAS_VIDEO);
            mSettingView.enableShareButton(!available);
        }
    }
}
