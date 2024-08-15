package com.tencent.cloud.tuikit.roomkit;

import com.tencent.cloud.tuikit.roomkit.model.ConferenceSessionImpl;

public abstract class ConferenceSession {
    public static ConferenceSession sharedInstance() {
        return ConferenceSessionImpl.sharedInstance();
    }

    public static void destroySharedInstance() {
        ConferenceSessionImpl.destroySharedInstance();
    }

    public abstract void addObserver(ConferenceDefine.ConferenceObserver observer);

    public abstract void removeObserver(ConferenceDefine.ConferenceObserver observer);
}
