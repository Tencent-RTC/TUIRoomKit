package com.tencent.liteav.tuiroom.ui;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.SurfaceView;
import android.view.ViewGroup;

import com.tencent.rtmp.ui.TXCloudVideoView;

public class RoomVideoView extends TXCloudVideoView {
    private static final String TAG = "RoomVideoView";

    private boolean                  mIsPlaying;
    private ViewGroup                mWaitBindGroup;
    private SurfaceView              mSurfaceView;
    private boolean                  mIsSelfView;
    private String                   mUserId;
    private boolean                  mNeedAttach;

    public void setNeedAttach(boolean needAttach) {
        this.mNeedAttach = needAttach;
    }

    public boolean isPlaying() {
        return mIsPlaying;
    }

    public void setPlayingWithoutSetVisible(boolean playing) {
        mIsPlaying = playing;
    }

    public void setPlaying(boolean playing) {
        Log.d(TAG, "setPlaying: " + getUserId() + " " + playing);
        mIsPlaying = playing;
        if (!mIsPlaying) {
            setVisibility(GONE);
        } else {
            setVisibility(VISIBLE);
        }
    }

    public String getUserId() {
        return mUserId;
    }

    public void setUserId(String userId) {
        mUserId = userId;
    }

    public void setSelfView(boolean selfView) {
        mIsSelfView = selfView;
        if (mSurfaceView == null && mIsSelfView) {
            mSurfaceView = new SurfaceView(getContext());
        }
    }

    public void setWaitBindGroup(ViewGroup mWaitBindGroup) {
        this.mWaitBindGroup = mWaitBindGroup;
    }

    public RoomVideoView(Context context) {
        this(context, null);
    }

    public TXCloudVideoView getPlayVideoView() {
        return this;
    }

    public TXCloudVideoView getLocalPreviewView() {
        if (mSurfaceView != null) {
            return new TXCloudVideoView(mSurfaceView);
        } else {
            return this;
        }
    }

    public RoomVideoView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public void refreshParent() {
        if (!mIsSelfView) {
            ViewGroup viewGroup = (ViewGroup) getParent();
            if (!mNeedAttach) {
                if (viewGroup != null) {
                    Log.d(TAG, getUserId() + "detach :" + viewGroup);
                    viewGroup.removeView(this);
                }
                return;
            }
            Log.d(TAG, getUserId() + "start attach old:" + viewGroup);
            if (viewGroup == null) {
                if (mWaitBindGroup != null) {
                    Log.d(TAG, "refreshParent " + getUserId() + " to: " + mWaitBindGroup);
                    mWaitBindGroup.addView(this);
                }
                return;
            }
            if (viewGroup != mWaitBindGroup) {
                Log.d(TAG, "refreshParent " + getUserId() + " to: " + mWaitBindGroup);
                viewGroup.removeView(this);
                mWaitBindGroup.addView(this);
            }
        } else {
            ViewGroup viewGroup = (ViewGroup) mSurfaceView.getParent();
            if (!mNeedAttach) {
                if (viewGroup != null) {
                    Log.d(TAG, getUserId() + "detach :" + viewGroup);
                    viewGroup.removeView(mSurfaceView);
                }
                return;
            }
            Log.d(TAG, getUserId() + "start attach old:" + viewGroup);
            if (viewGroup == null) {
                if (mWaitBindGroup != null) {
                    Log.d(TAG, "refreshParent " + getUserId() + " to: " + mWaitBindGroup);
                    mWaitBindGroup.addView(mSurfaceView);
                }
                return;
            }
            if (viewGroup != mWaitBindGroup) {
                Log.d(TAG, "refreshParent " + getUserId() + " to: " + mWaitBindGroup);
                viewGroup.removeView(mSurfaceView);
                mWaitBindGroup.addView(mSurfaceView);
            }
        }
    }

    private final Runnable measureAndLayout = new Runnable() {
        @Override
        public void run() {
            measure(
                    MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
            layout(getLeft(), getTop(), getRight(), getBottom());
        }
    };

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(measureAndLayout);
    }
}
