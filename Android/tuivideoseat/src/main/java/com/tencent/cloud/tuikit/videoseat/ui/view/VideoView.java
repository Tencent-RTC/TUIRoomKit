package com.tencent.cloud.tuikit.videoseat.ui.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;

public class VideoView extends TUIVideoView implements View.OnTouchListener {
    private static final float SCALE_MAX = 5.0f; //最大的缩放比例
    private static final float SCALE_MIN = 1.0f;

    private float       mPressedPoint1X = 0;     // 第一根手指按下的点X坐标
    private float       mPressedPoint2X = 0;     // 第二根手指按下的点X坐标
    private float       mPressedPoint1Y = 0;     // 第一根手指按下的点Y坐标
    private float       mPressedPoint2Y = 0;     // 第二根手指按下的点Y坐标
    private double      mDistBeforeMove = 0;     // 俩手指移动前距离
    private double      mDistAfterMove  = 0;     // 俩手指移动后距离
    private boolean     mIsPlaying;
    private boolean     mIsSelfView;
    private boolean     mEnableScale    = false;
    private String      mUserId;
    private ViewGroup   mWaitBindGroup;
    private SurfaceView mSurfaceView;


    public boolean isPlaying() {
        return mIsPlaying;
    }

    public void setPlayingWithoutSetVisible(boolean playing) {
        mIsPlaying = playing;
    }

    public void setPlaying(boolean playing) {
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

    public VideoView(Context context) {
        this(context, null);
    }

    public TUIVideoView getPlayVideoView() {
        return this;
    }

    public TUIVideoView getLocalPreviewView() {
        if (mSurfaceView != null) {
            return new TUIVideoView(mSurfaceView);
        } else {
            return this;
        }
    }

    public VideoView(Context context, AttributeSet attrs) {
        super(context, attrs);
        setOnTouchListener(this);
    }

    public void refreshParent() {
        if (!mIsSelfView) {
            ViewGroup viewGroup = (ViewGroup) getParent();
            if (viewGroup == null) {
                if (mWaitBindGroup != null) {
                    mWaitBindGroup.addView(this);
                }
                return;
            }
            if (viewGroup != mWaitBindGroup) {
                viewGroup.removeView(this);
                mWaitBindGroup.addView(this);
            }
        } else {
            ViewGroup viewGroup = (ViewGroup) mSurfaceView.getParent();
            if (viewGroup == null) {
                if (mWaitBindGroup != null) {
                    mWaitBindGroup.addView(mSurfaceView);
                }
                return;
            }
            if (viewGroup != mWaitBindGroup) {
                viewGroup.removeView(mSurfaceView);
                mWaitBindGroup.addView(mSurfaceView);
            }
        }
    }

    private final Runnable measureAndLayout = new Runnable() {
        @Override
        public void run() {
            measure(
                    View.MeasureSpec.makeMeasureSpec(getWidth(), View.MeasureSpec.EXACTLY),
                    View.MeasureSpec.makeMeasureSpec(getHeight(), View.MeasureSpec.EXACTLY));
            layout(getLeft(), getTop(), getRight(), getBottom());
        }
    };

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(measureAndLayout);
    }

    public void enableScale(boolean enable) {
        mEnableScale = enable;
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        if (!mEnableScale) {
            return false;
        }
        int pointerCount = event.getPointerCount();
        switch (event.getAction() & MotionEvent.ACTION_MASK) {
            case MotionEvent.ACTION_UP:
                if (pointerCount == 2) {
                    mPressedPoint1X = 0;
                    mPressedPoint1Y = 0;
                    mPressedPoint2X = 0;
                    mPressedPoint2Y = 0;
                }
                break;
            case MotionEvent.ACTION_MOVE:
                if (pointerCount == 2) {
                    float firstPointX = event.getX(0);
                    float secondPointX = event.getX(1);
                    float firstPointY = event.getY(0);
                    float secondPointY = event.getY(1);

                    double changeX1 = firstPointX - mPressedPoint1X;
                    double changeX2 = secondPointX - mPressedPoint2X;
                    double changeY1 = firstPointY - mPressedPoint1Y;
                    double changeY2 = secondPointY - mPressedPoint2Y;

                    if (getScaleX() > 1) {
                        float lessX = (float) ((changeX1) / 2 + (changeX2) / 2);
                        float lessY = (float) ((changeY1) / 2 + (changeY2) / 2);
                        setSelfPivot(-lessX, -lessY);
                    }

                    mDistAfterMove = spacing(event);
                    double space = mDistAfterMove - mDistBeforeMove;
                    float scale = (float) (getScaleX() + space / v.getWidth());
                    if (scale < SCALE_MIN) {
                        setScale(SCALE_MIN);
                    } else if (scale > SCALE_MAX) {
                        setScale(SCALE_MAX);
                    } else {
                        setScale(scale);
                    }
                }
                break;
            case MotionEvent.ACTION_POINTER_DOWN:
                if (pointerCount == 2) {
                    mPressedPoint1X = event.getX(0);
                    mPressedPoint2X = event.getX(1);
                    mPressedPoint1Y = event.getY(0);
                    mPressedPoint2Y = event.getY(1);
                    mDistBeforeMove = spacing(event);
                }
                break;
            case MotionEvent.ACTION_POINTER_UP:
                break;
            default:
                break;
        }
        return true;
    }

    /**
     * 触摸使用的移动事件
     */
    private void setSelfPivot(float lessX, float lessY) {
        float setPivotX;
        float setPivotY;
        setPivotX = getPivotX() + lessX;
        setPivotY = getPivotY() + lessY;
        if (setPivotX < 0 && setPivotY < 0) {
            setPivotX = 0;
            setPivotY = 0;
        } else if (setPivotX > 0 && setPivotY < 0) {
            setPivotY = 0;
            if (setPivotX > getWidth()) {
                setPivotX = getWidth();
            }
        } else if (setPivotX < 0 && setPivotY > 0) {
            setPivotX = 0;
            if (setPivotY > getHeight()) {
                setPivotY = getHeight();
            }
        } else {
            if (setPivotX > getWidth()) {
                setPivotX = getWidth();
            }
            if (setPivotY > getHeight()) {
                setPivotY = getHeight();
            }
        }
        setPivot(setPivotX, setPivotY);
    }

    /**
     * 计算两个点的距离
     */
    private double spacing(MotionEvent event) {
        if (event.getPointerCount() == 2) {
            float x = event.getX(0) - event.getX(1);
            float y = event.getY(0) - event.getY(1);
            return Math.sqrt(x * x + y * y);
        } else {
            return 0;
        }
    }

    /**
     * 平移画面，当画面的宽或高大于屏幕宽高时，调用此方法进行平移
     */
    private void setPivot(float x, float y) {
        setPivotX(x);
        setPivotY(y);
    }

    /**
     * 设置放大缩小
     */
    private void setScale(float scale) {
        setScaleX(scale);
        setScaleY(scale);
    }
}
