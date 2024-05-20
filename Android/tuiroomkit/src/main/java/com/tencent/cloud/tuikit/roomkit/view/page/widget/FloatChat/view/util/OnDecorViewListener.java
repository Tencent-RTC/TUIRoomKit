package com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.view.util;

import android.graphics.Rect;
import android.view.View;
import android.view.ViewTreeObserver;

public final class OnDecorViewListener implements ViewTreeObserver.OnGlobalLayoutListener {

    private final View mDecorView;
    private final OnKeyboardCallback mListener;

    private int mScreenHeight = 0;
    private int mCurrentKeyboardHeight = 0;

    public OnDecorViewListener(View decorView, OnKeyboardCallback listener) {
        this.mDecorView = decorView;
        this.mListener = listener;
    }

    @Override
    public void onGlobalLayout() {
        if (mDecorView == null) {
            return;
        }
        Rect r = new Rect();
        mDecorView.getWindowVisibleDisplayFrame(r);
        mScreenHeight = mScreenHeight == 0 ? r.bottom : mScreenHeight;
        int nowHeight = mScreenHeight - r.bottom;
        if (mCurrentKeyboardHeight != -1 && mCurrentKeyboardHeight != nowHeight) {
            if (mListener != null) {
                mListener.onKeyboardHeightUpdated(nowHeight);
            }
        }
        mCurrentKeyboardHeight = nowHeight;
    }

    public void clear() {
        mCurrentKeyboardHeight = -1;
        mScreenHeight = 0;
    }

    public interface OnKeyboardCallback {
        void onKeyboardHeightUpdated(int keyboardHeight);
    }
}