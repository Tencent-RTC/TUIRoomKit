package com.tencent.liteav.tuiroom.ui.widget.page;

import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearSmoothScroller;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.SnapHelper;

public class PagerSnapHelper extends SnapHelper {
    private RecyclerView mRecyclerView;

    /**
     * Binds the scroll tool to Recycler
     *
     * @param recyclerView RecyclerView
     * @throws IllegalStateException Abnormal status
     */
    @Override
    public void attachToRecyclerView(@Nullable RecyclerView recyclerView) throws
            IllegalStateException {
        super.attachToRecyclerView(recyclerView);
        mRecyclerView = recyclerView;
    }

    /**
     * Calculates the scroll vector for automatic page rollback and alignment
     *
     * @param layoutManager Layout manager
     * @param targetView    Target control
     * @return Distance to be scrolled
     */
    @Nullable
    @Override
    public int[] calculateDistanceToFinalSnap(@NonNull RecyclerView.LayoutManager layoutManager,
                                              @NonNull View targetView) {
        int pos = layoutManager.getPosition(targetView);
        int[] offset = new int[2];
        if (layoutManager instanceof RoomPageLayoutManager) {
            RoomPageLayoutManager manager = (RoomPageLayoutManager) layoutManager;
            offset = manager.getSnapOffset(pos);
        }
        return offset;
    }

    /**
     * Gets the view that is to be aligned, which is the first one on the page for the paged layout
     *
     * @param layoutManager Layout manager
     * @return Target control
     */
    @Nullable
    @Override
    public View findSnapView(RecyclerView.LayoutManager layoutManager) {
        if (layoutManager instanceof RoomPageLayoutManager) {
            RoomPageLayoutManager manager = (RoomPageLayoutManager) layoutManager;
            return manager.findSnapView();
        }
        return null;
    }

    /**
     * Gets the subscript of the target control position
     * Gets the subscript of the first view after scroll
     *
     * @param layoutManager Layout manager
     * @param velocityX     Scroll speed on the X axis
     * @param velocityY     Scroll speed on the Y axis
     * @return Target control subscript
     */
    @Override
    public int findTargetSnapPosition(RecyclerView.LayoutManager layoutManager,
                                      int velocityX, int velocityY) {
        int target = RecyclerView.NO_POSITION;
        if (null != layoutManager && layoutManager instanceof RoomPageLayoutManager) {
            RoomPageLayoutManager manager = (RoomPageLayoutManager) layoutManager;
            if (manager.canScrollHorizontally()) {
                if (velocityX > PagerConfig.getFlingThreshold()) {
                    target = manager.findNextPageFirstPos();
                } else if (velocityX < -PagerConfig.getFlingThreshold()) {
                    target = manager.findPrePageFirstPos();
                }
            } else if (manager.canScrollVertically()) {
                if (velocityY > PagerConfig.getFlingThreshold()) {
                    target = manager.findNextPageFirstPos();
                } else if (velocityY < -PagerConfig.getFlingThreshold()) {
                    target = manager.findPrePageFirstPos();
                }
            }
        }
        return target;
    }

    /**
     * Quick scroll
     *
     * @param velocityX Scroll speed on the X axis
     * @param velocityY Scroll speed on the Y axis
     * @return Whether to consume the event
     */
    @Override
    public boolean onFling(int velocityX, int velocityY) {
        RecyclerView.LayoutManager layoutManager = mRecyclerView.getLayoutManager();
        if (layoutManager == null) {
            return false;
        }
        RecyclerView.Adapter adapter = mRecyclerView.getAdapter();
        if (adapter == null) {
            return false;
        }
        int minFlingVelocity = PagerConfig.getFlingThreshold();
        return (Math.abs(velocityY) > minFlingVelocity || Math.abs(velocityX) > minFlingVelocity)
                && snapFromFling(layoutManager, velocityX, velocityY);
    }

    /**
     * Specific scheme for processing quick scroll
     *
     * @param layoutManager Layout manager
     * @param velocityX     Scroll speed on the X axis
     * @param velocityY     Scroll speed on the Y axis
     * @return Whether to consume the event
     */
    private boolean snapFromFling(@NonNull RecyclerView.LayoutManager layoutManager, int velocityX,
                                  int velocityY) {
        if (!(layoutManager instanceof RecyclerView.SmoothScroller.ScrollVectorProvider)) {
            return false;
        }

        RecyclerView.SmoothScroller smoothScroller = createSnapScroller(layoutManager);
        if (smoothScroller == null) {
            return false;
        }

        int targetPosition = findTargetSnapPosition(layoutManager, velocityX, velocityY);
        if (targetPosition == RecyclerView.NO_POSITION) {
            return false;
        }

        smoothScroller.setTargetPosition(targetPosition);
        layoutManager.startSmoothScroll(smoothScroller);
        return true;
    }

    /**
     * Customizes `LinearSmoothScroller` to control the speed
     *
     * @param layoutManager Layout manager
     * @return Custom `LinearSmoothScroller`
     */
    protected LinearSmoothScroller createSnapScroller(RecyclerView.LayoutManager layoutManager) {
        if (!(layoutManager instanceof RecyclerView.SmoothScroller.ScrollVectorProvider)) {
            return null;
        }
        return new PagerGridSmoothScroller(mRecyclerView);
    }

    //--- Public method ----------------------------------------------------------------------------------

    /**
     * Sets the scroll threshold
     *
     * @param threshold Scroll threshold
     */
    public void setFlingThreshold(int threshold) {
        PagerConfig.setFlingThreshold(threshold);
    }

}