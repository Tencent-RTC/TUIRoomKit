package com.tencent.cloud.tuikit.roomkit.model;

import com.tencent.cloud.tuikit.roomkit.ConferenceDefine;
import com.tencent.cloud.tuikit.roomkit.ConferenceSession;

public class ConferenceSessionImpl extends ConferenceSession {
    private static ConferenceSessionImpl     sInstance;
    private final  ConferenceObserverManager mConferenceObserverManager = new ConferenceObserverManager();

    private ConferenceSessionImpl() {}

    public static ConferenceSession sharedInstance() {
        if (sInstance == null) {
            synchronized (ConferenceSessionImpl.class) {
                if (sInstance == null) {
                    sInstance = new ConferenceSessionImpl();
                }
            }
        }
        return sInstance;
    }

    public static void destroySharedInstance() {
        synchronized (ConferenceSessionImpl.class) {
            if (sInstance != null) {
                sInstance.destroy();
                sInstance = null;
            }
        }
    }

    @Override
    public void addObserver(ConferenceDefine.ConferenceObserver observer) {
        mConferenceObserverManager.addObserver(observer);
    }

    @Override
    public void removeObserver(ConferenceDefine.ConferenceObserver observer) {
        mConferenceObserverManager.removeObserver(observer);
    }

    private void destroy() {
        mConferenceObserverManager.destroy();
    }
}
