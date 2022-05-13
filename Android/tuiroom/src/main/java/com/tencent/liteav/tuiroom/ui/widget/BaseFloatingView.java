package com.tencent.liteav.tuiroom.ui.widget;

import android.content.Context;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.WindowManager;
import android.widget.LinearLayout;

/**
 * 跟随手指移动View以及显示/隐藏的接口封装
 */
public class BaseFloatingView extends LinearLayout implements GestureDetector.OnGestureListener {

    protected final Context                    mContext;
    protected final WindowManager              mWindowManager;
    private         GestureDetector            mGestureDetector;
    private         WindowManager.LayoutParams layoutParams;
    private         float                      mLastX;
    private         float                      mLastY;

    public BaseFloatingView(Context context) {
        this(context, null);
    }

    public BaseFloatingView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public BaseFloatingView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        mContext = context;
        mGestureDetector = new GestureDetector(context, this);
        mWindowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return mGestureDetector.onTouchEvent(event);
    }

    @Override
    public boolean onDown(MotionEvent e) {
        mLastX = e.getRawX();
        mLastY = e.getRawY();
        return false;
    }

    @Override
    public void onShowPress(MotionEvent e) {
    }

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        return false;
    }

    @Override
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
        if (layoutParams == null) {
            layoutParams = (WindowManager.LayoutParams) getLayoutParams();
        }

        float nowX;
        float nowY;
        float tranX;
        // 获取移动时的X，Y坐标
        nowX = e2.getRawX();
        nowY = e2.getRawY();
        // 计算XY坐标偏移量
        tranX = nowX - mLastX;
        float tranY = nowY - mLastY;
        // 移动悬浮窗
        layoutParams.x += tranX;
        layoutParams.y += tranY;
        //更新悬浮窗位置
        mWindowManager.updateViewLayout(this, layoutParams);
        //记录当前坐标作为下一次计算的上一次移动的位置坐标
        mLastX = nowX;
        mLastY = nowY;
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
        return false;
    }

}