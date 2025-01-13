package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.floatwindow;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.os.Build;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;

import com.tencent.cloud.tuikit.engine.room.internal.utils.JObjectHelper;
import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.R;
import com.tencent.qcloud.tuicore.permission.PermissionRequester;
import com.tencent.qcloud.tuicore.util.ScreenUtil;
import com.tencent.qcloud.tuicore.util.TUIBuild;

public class FloatWindowManager {
    private static final int     CLICK_ACTION_MAX_MOVE_DISTANCE_PX = 10;
    private static final int     VIEW_MARGIN_EDGE_PX               = ScreenUtil.dip2px(10);
    private              Context mAppContext;

    private FrameLayout   mRootView;
    private FloatView     mFloatView;
    private WindowManager mWindowManager;
    private WindowManager.LayoutParams mWindowLayoutParams;
    private WindowManager.LayoutParams mOriginalLayoutParams;

    private FloatWindowObserver mObserver;

    private OrientationReceiver mOrientationReceiver;

    private float mTouchDownPointX;
    private float mTouchDownPointY;
    private float mCurrentTouchX;
    private float mCurrentTouchY;

    private boolean mIsActionDrag;
    private boolean mIsShowing = false;

    public FloatWindowManager(Context appContext) {
        mAppContext = appContext;
    }

    public void setObserver(FloatWindowObserver observer) {
        if (observer == null) {
            return;
        }
        mObserver = observer;
    }


    public long show() {
        if (mIsShowing) {
            return 0L;
        }
        PermissionRequester requester =  PermissionRequester.newInstance(PermissionRequester.FLOAT_PERMISSION, PermissionRequester.BG_START_PERMISSION);
        if (!requester.has()) {
            requester.request();
            return 0L;
        }

        mIsShowing = true;
        mRootView = new FrameLayout(mAppContext);
        mRootView.setOnTouchListener(new FloatRootViewTouchListener());
        mFloatView = new FloatView(mAppContext);
        mRootView.addView(mFloatView);
        mWindowManager = (WindowManager) mAppContext.getSystemService(Context.WINDOW_SERVICE);
        updateWindowLayoutParams();
        mWindowManager.addView(mRootView, mWindowLayoutParams);
        registerReceiver();
        return JObjectHelper.getJObjectAddress(mFloatView.getVideoView());
    }

    public void dismiss() {
        if (!mIsShowing) {
            return;
        }
        unregisterReceiver();
        mIsShowing = false;
        if (mRootView != null) {
            mRootView.removeAllViews();
            mWindowManager.removeView(mRootView);
        }
    }

    public void updateUserModel(UserModel userModel) {
        if (mFloatView == null) {
            return;
        }
        mFloatView.updateFloatViewUserModel(userModel);
    }


    public boolean isPictureInPictureSupported() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return false;
        }
        return mAppContext.getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
    }

    private void updateWindowLayoutParams() {
        mWindowLayoutParams = new WindowManager.LayoutParams();
        if (TUIBuild.getVersionInt() >= Build.VERSION_CODES.O) {
            mWindowLayoutParams.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            mWindowLayoutParams.type = WindowManager.LayoutParams.TYPE_PHONE;
        }
        mWindowLayoutParams.flags =
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

        mWindowLayoutParams.gravity = Gravity.RIGHT | Gravity.TOP;
        mWindowLayoutParams.x = VIEW_MARGIN_EDGE_PX;
        mWindowLayoutParams.y = ScreenUtil.getScreenHeight(mAppContext) / 4;
        mWindowLayoutParams.width = mAppContext.getResources().getDimensionPixelSize(R.dimen.rtc_conference_uikit_video_float_view_width);
        mWindowLayoutParams.height = mAppContext.getResources().getDimensionPixelSize(R.dimen.rtc_conference_uikit_video_float_view_height);
        mWindowLayoutParams.format = PixelFormat.TRANSPARENT;
    }

    private class FloatRootViewTouchListener implements View.OnTouchListener {
        @Override
        public boolean onTouch(View v, MotionEvent event) {
            int action = event.getAction();
            switch (action) {
                case MotionEvent.ACTION_DOWN:
                    mTouchDownPointX = event.getRawX();
                    mTouchDownPointY = event.getRawY();
                    mCurrentTouchX = mTouchDownPointX;
                    mCurrentTouchY = mTouchDownPointY;

                    mOriginalLayoutParams = mWindowLayoutParams;
                    mIsActionDrag = false;
                    break;

                case MotionEvent.ACTION_MOVE:
                    mWindowLayoutParams.x += (int) (mCurrentTouchX - event.getRawX());
                    mWindowLayoutParams.y += (int) (event.getRawY() - mCurrentTouchY);

                    updateLayout();

                    updateFlagOfDragAction(event.getRawX(), event.getRawY());
                    mCurrentTouchX = (int) event.getRawX();
                    mCurrentTouchY = (int) event.getRawY();
                    break;

                case MotionEvent.ACTION_UP:
                    if (mIsActionDrag) {
                        autoMoveToScreenEdge();
                    } else {
                        moveBackToOriginalPosition();
                        handleClickAction();
                    }
                    break;

                default:
                    break;
            }
            return true;
        }
    }

    private void updateFlagOfDragAction(float xMovePoint, float yMovePoint) {
        float xDistance = Math.abs(xMovePoint - mTouchDownPointX);
        float yDistance = Math.abs(yMovePoint - mTouchDownPointY);
        if (xDistance >= CLICK_ACTION_MAX_MOVE_DISTANCE_PX || yDistance >= CLICK_ACTION_MAX_MOVE_DISTANCE_PX) {
            mIsActionDrag = true;
        }
    }

    private void handleClickAction() {
        Log.i("TAG", "launchMainActivity:windowManager onFloatWindowClicked");
        if (mObserver != null) {
            mObserver.onFloatWindowClick();
        }
    }

    private void moveBackToOriginalPosition() {
        mWindowLayoutParams = mOriginalLayoutParams;
        mWindowManager.updateViewLayout(mRootView, mWindowLayoutParams);
    }

    private void autoMoveToScreenEdge() {
        mWindowLayoutParams.x = mWindowLayoutParams.x > (getMaxPositionX() >> 1) ? getMaxPositionX() : VIEW_MARGIN_EDGE_PX;
        mWindowManager.updateViewLayout(mRootView, mWindowLayoutParams);
    }

    private void updateLayout() {
        mWindowLayoutParams.x =
                Math.max(mWindowLayoutParams.x, VIEW_MARGIN_EDGE_PX);
        mWindowLayoutParams.x = Math.min(mWindowLayoutParams.x, getMaxPositionX());
        mWindowLayoutParams.y =
                Math.max(mWindowLayoutParams.y, VIEW_MARGIN_EDGE_PX);
        mWindowLayoutParams.y = Math.min(mWindowLayoutParams.y, getMaxPositionY());
        mWindowManager.updateViewLayout(mRootView, mWindowLayoutParams);
    }

    private int getMaxPositionX() {
        return ScreenUtil.getScreenWidth(mAppContext) - mRootView.getWidth() - VIEW_MARGIN_EDGE_PX;
    }

    private int getMaxPositionY() {
        return ScreenUtil.getScreenHeight(mAppContext) - mRootView.getHeight() - VIEW_MARGIN_EDGE_PX;
    }

    private void registerReceiver() {
        if (mOrientationReceiver != null) {
            return;
        }
        mOrientationReceiver = new OrientationReceiver();
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_CONFIGURATION_CHANGED);
        mAppContext.registerReceiver(mOrientationReceiver, filter);
    }

    private void unregisterReceiver() {
        if (mOrientationReceiver != null) {
            mAppContext.unregisterReceiver(mOrientationReceiver);
            mOrientationReceiver = null;
        }
    }

    private class OrientationReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (Intent.ACTION_CONFIGURATION_CHANGED.equals(intent.getAction())) {
                updateWindowLayoutParams();
                updateLayout();
            }
        }
    }

    public static abstract class FloatWindowObserver {

        public void onFloatWindowClick() {
        }
    }
}
