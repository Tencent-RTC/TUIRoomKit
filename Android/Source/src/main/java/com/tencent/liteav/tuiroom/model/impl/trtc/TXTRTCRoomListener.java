package com.tencent.liteav.tuiroom.model.impl.trtc;

import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCStatistics;

import java.util.ArrayList;

public interface TXTRTCRoomListener {
    void onTRTCAnchorEnter(String userId);

    void onTRTCAnchorExit(String userId);

    void onTRTCVideoAvailable(String userId, boolean available);

    void onTRTCAudioAvailable(String userId, boolean available);

    void onError(int errorCode, String errorMsg);

    void onNetworkQuality(TRTCCloudDef.TRTCQuality trtcQuality, ArrayList<TRTCCloudDef.TRTCQuality> arrayList);

    void onStatistics(TRTCStatistics statistics);

    void onUserVoiceVolume(ArrayList<TRTCCloudDef.TRTCVolumeInfo> userVolumes, int totalVolume);

    void onTRTCSubStreamAvailable(String userId, boolean available);

    void onScreenCaptureStarted();

    void onScreenCaptureStopped(int reason);
}
