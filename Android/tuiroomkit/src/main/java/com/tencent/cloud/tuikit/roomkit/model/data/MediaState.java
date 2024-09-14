package com.tencent.cloud.tuikit.roomkit.model.data;


import com.trtc.tuikit.common.livedata.LiveData;

public class MediaState {
    public LiveData<Boolean> isSpeakerOpened = new LiveData<>(true);
    public LiveData<Boolean> isCameraOpened  = new LiveData<>(false);
    public LiveData<Boolean> isFrontCamera   = new LiveData<>(true);
}
