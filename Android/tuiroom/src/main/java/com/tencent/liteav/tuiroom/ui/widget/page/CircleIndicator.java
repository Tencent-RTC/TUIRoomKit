package com.tencent.liteav.tuiroom.ui.widget.page;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

import com.blankj.utilcode.util.SizeUtils;

public class CircleIndicator extends View {
    private Paint circlePaint;

    private int   mPageNum;
    private float mScrollPercent = 0f;
    private int   mCurrentPosition;
    private int   mGapSize;

    private float mRadius;
    private int   mColorOn;
    private int   mColorOff;

    public CircleIndicator(Context context) {
        super(context);
        init();
    }

    public CircleIndicator(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public CircleIndicator(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        mRadius = SizeUtils.dp2px(3);
        circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mColorOn = Color.WHITE;
        mColorOff = Color.parseColor("#888888");
        mGapSize = SizeUtils.dp2px(10);
    }

    public void setSelectDotColor(int colorOn) {
        this.mColorOn = colorOn;
    }

    public void setUnSelectDotColor(int colorOff) {
        this.mColorOff = colorOff;
    }


    public void onPageScrolled(int position, float percent) {
        mScrollPercent = percent;
        mCurrentPosition = position;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mPageNum <= 0) {
            return;
        }
        float left = (getWidth() - (mPageNum - 1) * mGapSize) * 0.5f;
        float height = getHeight() * 0.5f;
        circlePaint.setColor(mColorOff);
        for (int i = 0; i < mPageNum; i++) {
            canvas.drawCircle(left + i * mGapSize, height, mRadius, circlePaint);
        }
        circlePaint.setColor(mColorOn);
        canvas.drawCircle(left + mCurrentPosition * mGapSize + mGapSize * mScrollPercent, height, mRadius,
                circlePaint);
    }

    public void setPageNum(int num) {
        mPageNum = num;
    }
}
