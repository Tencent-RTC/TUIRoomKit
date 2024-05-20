package com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.store;

import com.trtc.tuikit.common.livedata.LiveData;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.model.TUIFloatChat;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.model.DefaultEmojiResource;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.IEmojiResource;

public class FloatChatStore {
    private static FloatChatStore sInstance;

    public LiveData<TUIFloatChat> mSendBarrage = new LiveData<>();

    public final IEmojiResource   mEmojiResource;

    public static FloatChatStore sharedInstance() {
        if (sInstance == null) {
            synchronized (FloatChatStore.class) {
                if (sInstance == null) {
                    sInstance = new FloatChatStore();
                }
            }
        }
        return sInstance;
    }

    private FloatChatStore() {
        mEmojiResource = new DefaultEmojiResource();
    }

}
