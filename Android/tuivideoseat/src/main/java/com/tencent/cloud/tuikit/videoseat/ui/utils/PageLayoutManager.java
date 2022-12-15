package com.tencent.cloud.tuikit.videoseat.ui.utils;

import static android.view.View.MeasureSpec.EXACTLY;
import static androidx.recyclerview.widget.RecyclerView.SCROLL_STATE_IDLE;

import android.graphics.PointF;
import android.graphics.Rect;
import android.util.Log;
import android.util.SparseArray;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.IntDef;
import androidx.annotation.IntRange;
import androidx.recyclerview.widget.LinearSmoothScroller;
import androidx.recyclerview.widget.RecyclerView;

public class PageLayoutManager extends RecyclerView.LayoutManager implements
        RecyclerView.SmoothScroller.ScrollVectorProvider {
    private static final String TAG = PageLayoutManager.class.getName();

    public static final int VERTICAL   = 0;
    public static final int HORIZONTAL = 1;

    private int     mLastPageCount           = -1;
    private int     mLastPageIndex           = -1;
    private int     mFirstVisiblePosition;
    private boolean mChangeSelectInScrolling = true;

    @IntDef({VERTICAL, HORIZONTAL})
    public @interface OrientationType {
    }

    @OrientationType
    private int mOrientation;

    private int mOffsetX = 0;
    private int mOffsetY = 0;

    private int mRows;
    private int mColumns;
    private int mOnePageSize;

    private SparseArray<Rect> mItemFrames;

    private int mItemWidth  = 0;
    private int mItemHeight = 0;

    private int mWidthUsed  = 0;
    private int mHeightUsed = 0;

    private int mMaxScrollX;
    private int mMaxScrollY;
    private int mScrollState = SCROLL_STATE_IDLE;

    private boolean mAllowContinuousScroll = true;

    private RecyclerView mRecyclerView;

    public PageLayoutManager(@IntRange(from = 1, to = 100) int rows,
                             @IntRange(from = 1, to = 100) int columns,
                             @OrientationType int orientation) {
        mItemFrames = new SparseArray<>();
        mOrientation = orientation;
        mRows = rows;
        mColumns = columns;
        mOnePageSize = mRows * mColumns;
    }

    @Override
    public void onAttachedToWindow(RecyclerView view) {
        super.onAttachedToWindow(view);
        mRecyclerView = view;
    }

    @Override
    public void onLayoutChildren(RecyclerView.Recycler recycler, RecyclerView.State state) {
        if (state.isPreLayout() || getUsableWidth() == 0) {
            return;
        }

        if (getItemCount() == 0) {
            removeAndRecycleAllViews(recycler);
            setPageCount(0);
            setPageIndex(0, false);
            return;
        } else if (getItemCount() == 1) {
            detachAndScrapAttachedViews(recycler);
            View scrap = recycler.getViewForPosition(0);
            measureChildWithMargins(scrap, 0, 0);
            addView(scrap);
            layoutDecorated(scrap,
                    0,
                    0,
                    getWidth(),
                    getHeight());
            if (mPageListener != null) {
                mPageListener.onItemVisible(0, 0);
            }
            return;
        } else if (getItemCount() == 2) {
            detachAndScrapAttachedViews(recycler);
            View scrap = recycler.getViewForPosition(0);
            int heightUse = getUsableHeight() / 2;
            measureChildWithMargins(scrap, 0, heightUse);
            addView(scrap);
            layoutDecorated(scrap,
                    0,
                    0,
                    getWidth(),
                    heightUse);
            scrap = recycler.getViewForPosition(1);
            measureChildWithMargins(scrap, 0, heightUse);
            addView(scrap);
            layoutDecorated(scrap,
                    0,
                    heightUse,
                    getWidth(),
                    getHeight());
            if (mPageListener != null) {
                mPageListener.onItemVisible(0, 1);
            }
            return;
        } else {
            setPageCount(getTotalPageCount());
            setPageIndex(getPageIndexByOffset(), false);
        }

        int mPageCount = getItemCount() / mOnePageSize;
        if (getItemCount() % mOnePageSize != 0) {
            mPageCount++;
        }

        if (canScrollHorizontally()) {
            mMaxScrollX = (mPageCount - 1) * getUsableWidth();
            mMaxScrollY = 0;
            if (mOffsetX > mMaxScrollX) {
                mOffsetX = mMaxScrollX;
            }
        } else {
            mMaxScrollX = 0;
            mMaxScrollY = (mPageCount - 1) * getUsableHeight();
            if (mOffsetY > mMaxScrollY) {
                mOffsetY = mMaxScrollY;
            }
        }


        if (mItemWidth <= 0) {
            mItemWidth = getUsableWidth() / mColumns;
        }
        if (mItemHeight <= 0) {
            mItemHeight = getUsableHeight() / mRows;
        }

        mWidthUsed = getUsableWidth() - mItemWidth;
        mHeightUsed = getUsableHeight() - mItemHeight;

        for (int i = 0; i < mOnePageSize * 2; i++) {
            getItemFrameByPosition(i);
        }

        recycleAndFillItems(recycler, state, true);
    }

    @Override
    public void onLayoutCompleted(RecyclerView.State state) {
        super.onLayoutCompleted(state);
        if (state.isPreLayout()) {
            return;
        }
        // 页面状态回调
        setPageCount(getTotalPageCount());
        setPageIndex(getPageIndexByOffset(), false);
    }

    private void recycleAndFillItems(RecyclerView.Recycler recycler, RecyclerView.State state,
                                     boolean isStart) {
        if (state.isPreLayout()) {
            return;
        }

        Rect displayRect = new Rect(mOffsetX - mItemWidth, mOffsetY - mItemHeight,
                getUsableWidth() + mOffsetX + mItemWidth, getUsableHeight() + mOffsetY + mItemHeight);
        displayRect.intersect(0, 0, mMaxScrollX + getUsableWidth(), mMaxScrollY
                + getUsableHeight());

        int startPos;
        int pageIndex = getPageIndexByOffset();
        startPos = pageIndex * mOnePageSize;
        startPos = startPos - mOnePageSize * 2;
        if (startPos < 0) {
            startPos = 0;
        }
        int stopPos = startPos + mOnePageSize * 4;
        if (stopPos > getItemCount()) {
            stopPos = getItemCount();
        }

        detachAndScrapAttachedViews(recycler);

        if (isStart) {
            for (int i = startPos; i < stopPos; i++) {
                addOrRemove(recycler, displayRect, i);
            }
        } else {
            for (int i = stopPos - 1; i >= startPos; i--) {
                addOrRemove(recycler, displayRect, i);
            }
        }
        startPos = pageIndex * mOnePageSize;
        stopPos = startPos + mOnePageSize - 1;
        if (stopPos >= getItemCount()) {
            stopPos = getItemCount() - 1;
        }
        if (mPageListener != null) {
            mPageListener.onItemVisible(startPos, stopPos);
        }
        mFirstVisiblePosition = startPos;
    }

    public int findFirstVisibleItemPosition() {
        return mFirstVisiblePosition;
    }

    private void addOrRemove(RecyclerView.Recycler recycler, Rect displayRect, int i) {
        View child = recycler.getViewForPosition(i);
        Rect rect = getItemFrameByPosition(i);
        if (!Rect.intersects(displayRect, rect)) {
            removeAndRecycleView(child, recycler);
        } else {
            addView(child);
            measureChildWithMargins(child, mWidthUsed, mHeightUsed);
            RecyclerView.LayoutParams lp = (RecyclerView.LayoutParams) child.getLayoutParams();
            layoutDecorated(child,
                    rect.left - mOffsetX + lp.leftMargin + getPaddingLeft(),
                    rect.top - mOffsetY + lp.topMargin + getPaddingTop(),
                    rect.right - mOffsetX - lp.rightMargin + getPaddingLeft(),
                    rect.bottom - mOffsetY - lp.bottomMargin + getPaddingTop());
        }
    }

    @Override
    public int scrollHorizontallyBy(int dx, RecyclerView.Recycler recycler, RecyclerView.State
            state) {
        int newX = mOffsetX + dx;
        int result = dx;
        if (newX > mMaxScrollX) {
            result = mMaxScrollX - mOffsetX;
        } else if (newX < 0) {
            result = 0 - mOffsetX;
        }
        mOffsetX += result;
        setPageIndex(getPageIndexByOffset(), true);
        offsetChildrenHorizontal(-result);

        onLayoutChildren(recycler, state);
        return result;
    }

    @Override
    public int scrollVerticallyBy(int dy, RecyclerView.Recycler recycler, RecyclerView.State
            state) {
        int newY = mOffsetY + dy;
        int result = dy;
        if (newY > mMaxScrollY) {
            result = mMaxScrollY - mOffsetY;
        } else if (newY < 0) {
            result = 0 - mOffsetY;
        }
        mOffsetY += result;
        setPageIndex(getPageIndexByOffset(), true);
        offsetChildrenVertical(-result);
        if (result > 0) {
            recycleAndFillItems(recycler, state, true);
        } else {
            recycleAndFillItems(recycler, state, false);
        }
        return result;
    }

    @Override
    public void onScrollStateChanged(int state) {
        mScrollState = state;
        super.onScrollStateChanged(state);
        if (state == SCROLL_STATE_IDLE) {
            setPageIndex(getPageIndexByOffset(), false);
        }
    }

    private Rect getItemFrameByPosition(int pos) {
        Rect rect = mItemFrames.get(pos);
        if (null == rect) {
            rect = new Rect();
            int page = pos / mOnePageSize;
            int offsetX = 0;
            int offsetY = 0;
            if (canScrollHorizontally()) {
                offsetX += getUsableWidth() * page;
            } else {
                offsetY += getUsableHeight() * page;
            }

            int pagePos = pos % mOnePageSize;
            int row = pagePos / mColumns;
            int col = pagePos - (row * mColumns);

            offsetX += col * mItemWidth;
            offsetY += row * mItemHeight;

            rect.left = offsetX;
            rect.top = offsetY;
            rect.right = offsetX + mItemWidth;
            rect.bottom = offsetY + mItemHeight;

            mItemFrames.put(pos, rect);
        }
        return rect;
    }

    private int getUsableWidth() {
        return getWidth() - getPaddingLeft() - getPaddingRight();
    }

    private int getUsableHeight() {
        return getHeight() - getPaddingTop() - getPaddingBottom();
    }

    private int getTotalPageCount() {
        if (getItemCount() <= 0) {
            return 0;
        }
        int totalCount = getItemCount() / mOnePageSize;
        if (getItemCount() % mOnePageSize != 0) {
            totalCount++;
        }
        return totalCount;
    }

    private int getPageIndexByPos(int pos) {
        return pos / mOnePageSize;
    }

    private int getPageIndexByOffset() {
        int pageIndex;
        if (canScrollVertically()) {
            int pageHeight = getUsableHeight();
            if (mOffsetY <= 0 || pageHeight <= 0) {
                pageIndex = 0;
            } else {
                pageIndex = mOffsetY / pageHeight;
                if (mOffsetY % pageHeight > pageHeight / 2) {
                    pageIndex++;
                }
            }
        } else {
            int pageWidth = getUsableWidth();
            if (mOffsetX <= 0 || pageWidth <= 0) {
                pageIndex = 0;
            } else {
                pageIndex = mOffsetX / pageWidth;
                if (mOffsetX % pageWidth > pageWidth / 2) {
                    pageIndex++;
                }
            }
        }
        return pageIndex;
    }

    @Override
    public RecyclerView.LayoutParams generateDefaultLayoutParams() {
        return new RecyclerView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    @Override
    public void onMeasure(RecyclerView.Recycler recycler, RecyclerView.State state, int widthMeasureSpec,
                          int heightMeasureSpec) {
        super.onMeasure(recycler, state, widthMeasureSpec, heightMeasureSpec);
        int widthsize = View.MeasureSpec.getSize(widthMeasureSpec);
        int widthmode = View.MeasureSpec.getMode(widthMeasureSpec);

        int heightsize = View.MeasureSpec.getSize(heightMeasureSpec);
        int heightmode = View.MeasureSpec.getMode(heightMeasureSpec);

        if (widthmode != EXACTLY && widthsize > 0) {
            widthmode = EXACTLY;
        }
        if (heightmode != EXACTLY && heightsize > 0) {
            heightmode = EXACTLY;
        }
        setMeasuredDimension(View.MeasureSpec.makeMeasureSpec(widthsize, widthmode),
                View.MeasureSpec.makeMeasureSpec(heightsize, heightmode));
    }

    @Override
    public boolean canScrollHorizontally() {
        return mOrientation == HORIZONTAL;
    }

    @Override
    public boolean canScrollVertically() {
        return mOrientation == VERTICAL;
    }

    int findNextPageFirstPos() {
        int page = mLastPageIndex;
        page++;
        if (page >= getTotalPageCount()) {
            page = getTotalPageCount() - 1;
        }
        return page * mOnePageSize;
    }


    int findPrePageFirstPos() {
        int page = mLastPageIndex;
        page--;
        if (page < 0) {
            page = 0;
        }
        return page * mOnePageSize;
    }

    public int getOffsetX() {
        return mOffsetX;
    }

    public int getOffsetY() {
        return mOffsetY;
    }


    @Override
    public PointF computeScrollVectorForPosition(int targetPosition) {
        PointF vector = new PointF();
        int[] pos = getSnapOffset(targetPosition);
        vector.x = pos[0];
        vector.y = pos[1];
        return vector;
    }

    int[] getSnapOffset(int targetPosition) {
        int[] offset = new int[2];
        int[] pos = getPageLeftTopByPosition(targetPosition);
        offset[0] = pos[0] - mOffsetX;
        offset[1] = pos[1] - mOffsetY;
        return offset;
    }

    private int[] getPageLeftTopByPosition(int pos) {
        int[] leftTop = new int[2];
        int page = getPageIndexByPos(pos);
        if (canScrollHorizontally()) {
            leftTop[0] = page * getUsableWidth();
            leftTop[1] = 0;
        } else {
            leftTop[0] = 0;
            leftTop[1] = page * getUsableHeight();
        }
        return leftTop;
    }

    public View findSnapView() {
        if (null != getFocusedChild()) {
            return getFocusedChild();
        }
        if (getChildCount() <= 0) {
            return null;
        }
        int targetPos = getPageIndexByOffset() * mOnePageSize;   // 目标Pos
        for (int i = 0; i < getChildCount(); i++) {
            int childPos = getPosition(getChildAt(i));
            if (childPos == targetPos) {
                return getChildAt(i);
            }
        }
        return getChildAt(0);
    }


    private void setPageCount(int pageCount) {
        if (pageCount >= 0) {
            if (mPageListener != null && pageCount != mLastPageCount) {
                mPageListener.onPageSizeChanged(pageCount);
            }
            mLastPageCount = pageCount;
        }
    }

    private void setPageIndex(int pageIndex, boolean isScrolling) {
        if (pageIndex == mLastPageIndex) {
            return;
        }
        if (isAllowContinuousScroll()) {
            mLastPageIndex = pageIndex;
        } else {
            if (!isScrolling) {
                mLastPageIndex = pageIndex;
            }
        }
        if (isScrolling && !mChangeSelectInScrolling) {
            return;
        }
        if (pageIndex >= 0) {
            if (null != mPageListener) {
                mPageListener.onPageSelect(pageIndex);
            }
        }
    }

    public void setChangeSelectInScrolling(boolean changeSelectInScrolling) {
        mChangeSelectInScrolling = changeSelectInScrolling;
    }

    @OrientationType
    public int setOrientationType(@OrientationType int orientation) {
        if (mOrientation == orientation || mScrollState != SCROLL_STATE_IDLE) {
            return mOrientation;
        }
        mOrientation = orientation;
        mItemFrames.clear();
        int x = mOffsetX;
        int y = mOffsetY;
        mOffsetX = y / getUsableHeight() * getUsableWidth();
        mOffsetY = x / getUsableWidth() * getUsableHeight();
        int mx = mMaxScrollX;
        int my = mMaxScrollY;
        mMaxScrollX = my / getUsableHeight() * getUsableWidth();
        mMaxScrollY = mx / getUsableWidth() * getUsableHeight();
        return mOrientation;
    }

    @Override
    public void smoothScrollToPosition(RecyclerView recyclerView, RecyclerView.State state, int position) {
        int targetPageIndex = getPageIndexByPos(position);
        smoothScrollToPage(targetPageIndex);
    }

    public void smoothPrePage() {
        smoothScrollToPage(getPageIndexByOffset() - 1);
    }

    public void smoothNextPage() {
        smoothScrollToPage(getPageIndexByOffset() + 1);
    }

    public void smoothScrollToPage(int pageIndex) {
        if (pageIndex < 0 || pageIndex >= mLastPageCount) {
            Log.e(TAG, "pageIndex is outOfIndex, must in [0, " + mLastPageCount + ").");
            return;
        }
        if (null == mRecyclerView) {
            Log.e(TAG, "RecyclerView Not Found!");
            return;
        }

        int currentPageIndex = getPageIndexByOffset();
        if (Math.abs(pageIndex - currentPageIndex) > 3) {
            if (pageIndex > currentPageIndex) {
                scrollToPage(pageIndex - 3);
            } else if (pageIndex < currentPageIndex) {
                scrollToPage(pageIndex + 3);
            }
        }

        LinearSmoothScroller smoothScroller = new PagerGridSmoothScroller(mRecyclerView);
        int position = pageIndex * mOnePageSize;
        smoothScroller.setTargetPosition(position);
        startSmoothScroll(smoothScroller);
    }

    @Override
    public void scrollToPosition(int position) {
        int pageIndex = getPageIndexByPos(position);
        scrollToPage(pageIndex);
    }

    public void prePage() {
        scrollToPage(getPageIndexByOffset() - 1);
    }

    public void nextPage() {
        scrollToPage(getPageIndexByOffset() + 1);
    }

    public void scrollToPage(int pageIndex) {
        if (pageIndex < 0 || pageIndex >= mLastPageCount) {
            Log.e(TAG, "pageIndex = " + pageIndex + " is out of bounds, mast in [0, " + mLastPageCount + ")");
            return;
        }

        if (null == mRecyclerView) {
            Log.e(TAG, "RecyclerView Not Found!");
            return;
        }

        int mTargetOffsetXBy;
        int mTargetOffsetYBy;
        if (canScrollVertically()) {
            mTargetOffsetXBy = 0;
            mTargetOffsetYBy = pageIndex * getUsableHeight() - mOffsetY;
        } else {
            mTargetOffsetXBy = pageIndex * getUsableWidth() - mOffsetX;
            mTargetOffsetYBy = 0;
        }
        mRecyclerView.scrollBy(mTargetOffsetXBy, mTargetOffsetYBy);
        setPageIndex(pageIndex, false);
    }

    public boolean isAllowContinuousScroll() {
        return mAllowContinuousScroll;
    }

    public void setAllowContinuousScroll(boolean allowContinuousScroll) {
        mAllowContinuousScroll = allowContinuousScroll;
    }

    private PageListener mPageListener = null;

    public void setPageListener(PageListener pageListener) {
        mPageListener = pageListener;
    }

    public interface PageListener {

        void onPageSizeChanged(int pageSize);

        void onPageSelect(int pageIndex);

        void onItemVisible(int fromItem, int toItem);
    }
}
