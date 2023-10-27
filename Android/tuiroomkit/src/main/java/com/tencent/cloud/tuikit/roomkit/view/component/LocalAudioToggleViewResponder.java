package com.tencent.cloud.tuikit.roomkit.view.component;

public interface LocalAudioToggleViewResponder {
    void onLocalAudioEnabled();

    void onLocalAudioDisabled();

    void onLocalAudioVolumedChanged(int volume);
}
