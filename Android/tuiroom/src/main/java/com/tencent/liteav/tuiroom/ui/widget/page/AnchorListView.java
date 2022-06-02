package com.tencent.liteav.tuiroom.ui.widget.page;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.RecyclerView;

import com.blankj.utilcode.util.SizeUtils;
import com.tencent.liteav.basic.ImageLoader;
import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;
import com.tencent.liteav.tuiroom.ui.RoomVideoView;
import com.tencent.liteav.tuiroom.ui.MemberEntity;
import com.tencent.liteav.tuiroom.ui.MemberListAdapter;
import com.tencent.rtmp.ui.TXCloudVideoView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import de.hdodenhof.circleimageview.CircleImageView;

import static com.tencent.liteav.tuiroom.ui.MemberListAdapter.QUALITY;
import static com.tencent.liteav.tuiroom.ui.MemberListAdapter.VOLUME;

public class AnchorListView extends RelativeLayout {
    private static final String  TAG            = "AnchorListView";
    private static final int     MAX_ITEM_COUNT = 6;
    private              Context mContext;

    private RecyclerView      mRecyclerView;
    private MemberListAdapter mMemberListAdapter;

    private List<MemberEntity> mMemberEntityList;
    private List<String>       mVisibleVideoStreams;
    private Listener           mListener;

    private ViewGroup                mMultiConversation;
    private Map<Integer, ViewHolder> mViewHolderMap;
    private CircleIndicator          mCircleIndicator;
    private RoomPageLayoutManager    mPageLayoutManager;
    private Set<String>              mShareScreenList;
    private View.OnClickListener     mSmallWindowTapListener;
    private boolean                  mShowListView;

    public AnchorListView(Context context, AttributeSet attrs) {
        super(context, attrs);
        mContext = context;
        mViewHolderMap = new HashMap<>();
        mShareScreenList = new HashSet<>();
        inflate(mContext, R.layout.tuiroom_anchor_list_view, this);
        mRecyclerView = (RecyclerView) findViewById(R.id.rv_list);
        mMultiConversation = (ViewGroup) findViewById(R.id.multi_conversation);
        mCircleIndicator = (CircleIndicator) findViewById(R.id.simple_view);
        int unSelectColor = getResources().getColor(R.color.tuiroom_color_indicator_un_select);
        int selectColor = getResources().getColor(R.color.tuiroom_color_white);
        mCircleIndicator.setSelectDotColor(selectColor);
        mCircleIndicator.setUnSelectDotColor(unSelectColor);
    }

    public void setData(List<MemberEntity> list) {
        mMemberEntityList = list;
        if (mMemberEntityList.size() > 5) {
            return;
        }
        initView();
    }

    private void initView() {
        if (mMemberEntityList == null) {
            return;
        }
        if (isShareScreen()) {
            return;
        }
        int size = mMemberEntityList.size();
        Log.d(TAG, "initView memberList size is " + size);
        if (size > 5) {
            clearTapListener();
            showListView();
        } else if (size > 4) {
            clearTapListener();
            initMultiConversationView(R.layout.tuiroom_anchor_list_view_five_member);
        } else if (size > 3) {
            clearTapListener();
            initMultiConversationView(R.layout.tuiroom_anchor_list_view_four_member);
        } else if (size > 2) {
            clearTapListener();
            initMultiConversationView(R.layout.tuiroom_anchor_list_view_three_member);
        } else if (size > 1) {
            initTwoMemberView();
        } else {
            clearTapListener();
            initMultiConversationView(R.layout.tuiroom_anchor_list_view_one_member);
            ViewHolder holder = mViewHolderMap.get(0);
            holder.setMarginBottom(92);
        }
    }

    private void clearTapListener() {
        mSmallWindowTapListener = null;
    }

    private void initScreenShareView(int position) {
        if (mMemberEntityList == null) {
            return;
        }
        mRecyclerView.setVisibility(GONE);
        mMultiConversation.setVisibility(VISIBLE);
        mMultiConversation.removeAllViews();
        inflate(mContext, R.layout.tuiroom_anchor_list_view_screen_share, mMultiConversation);
        int selfIndex = 0;
        for (int i = 0; i < mMemberEntityList.size(); i++) {
            MemberEntity entity = mMemberEntityList.get(i);
            if (entity.isSelf()) {
                selfIndex = i;
            }
        }
        initViewHolder(selfIndex, R.id.item1);
        initViewHolder(position, R.id.item2);
    }

    private void initTwoMemberView() {
        if (mMemberEntityList == null) {
            return;
        }
        mViewHolderMap.clear();
        mRecyclerView.setVisibility(GONE);
        mMultiConversation.setVisibility(VISIBLE);
        mMultiConversation.removeAllViews();
        final View rootView = inflate(mContext, R.layout.tuiroom_anchor_list_view_two_member, mMultiConversation);
        if (mSmallWindowTapListener == null) {
            mSmallWindowTapListener = new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    updateTwoConversationWindow(rootView);
                }
            };
        }
        for (int i = 0; i < mMemberEntityList.size(); i++) {
            MemberEntity entity = mMemberEntityList.get(i);
            if (entity.isSelf()) {
                initViewHolder(i, R.id.item1);
                final ViewHolder selfVieHolder = mViewHolderMap.get(i);
                selfVieHolder.setMarginBottom(0);
                rootView.findViewById(R.id.item1).setOnClickListener(mSmallWindowTapListener);
            } else {
                initViewHolder(i, R.id.item2);
                final ViewHolder oppositeViewHolder = mViewHolderMap.get(i);
                oppositeViewHolder.setMarginBottom(92);
            }
        }
    }

    private void updateTwoConversationWindow(View rootView) {
        RelativeLayout layout1 = rootView.findViewById(R.id.item1);
        RelativeLayout layout2 = rootView.findViewById(R.id.item2);
        RelativeLayout previousBigView;
        RelativeLayout previousSmallView;
        if (layout1.getHeight() > layout2.getHeight()) {
            previousBigView = layout1;
            previousSmallView = layout2;
        } else {
            previousBigView = layout2;
            previousSmallView = layout1;
        }
        ViewGroup viewGroup = (ViewGroup) layout1.getParent();
        viewGroup.removeAllViews();
        ConstraintLayout.LayoutParams smallParams = new ConstraintLayout.LayoutParams(SizeUtils.dp2px(96),
                SizeUtils.dp2px(170));
        smallParams.width = SizeUtils.dp2px(96);
        smallParams.height = SizeUtils.dp2px(170);
        smallParams.rightToRight = R.id.rl_content;
        smallParams.topToTop = R.id.rl_content;
        smallParams.topMargin = SizeUtils.dp2px(92);

        RelativeLayout transferBigLayout = previousSmallView;
        RelativeLayout transferSmallLayout = previousBigView;
        ConstraintLayout.LayoutParams bigParams = new ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT, ConstraintLayout.LayoutParams.MATCH_PARENT);
        transferBigLayout.setLayoutParams(bigParams);
        transferSmallLayout.setLayoutParams(smallParams);
        viewGroup.addView(transferBigLayout);
        viewGroup.addView(transferSmallLayout);

        View bigUserInfoGroup = transferBigLayout.findViewById(R.id.user_info_group);
        RelativeLayout.LayoutParams bigUserInfoParams =
                (RelativeLayout.LayoutParams) bigUserInfoGroup.getLayoutParams();
        bigUserInfoParams.bottomMargin = SizeUtils.dp2px(92);
        bigUserInfoGroup.setLayoutParams(bigUserInfoParams);

        View smallUserInfoGroup = transferSmallLayout.findViewById(R.id.user_info_group);
        RelativeLayout.LayoutParams smallUserInfoParams =
                (RelativeLayout.LayoutParams) smallUserInfoGroup.getLayoutParams();
        smallUserInfoParams.bottomMargin = 0;
        smallUserInfoGroup.setLayoutParams(smallUserInfoParams);
        transferBigLayout.setOnClickListener(null);
        transferSmallLayout.setOnClickListener(mSmallWindowTapListener);
    }

    private void updateMultiConversationView(int position) {
        ViewHolder viewHolder = mViewHolderMap.get(position);
        if (viewHolder != null) {
            MemberEntity entity = mMemberEntityList.get(position);
            viewHolder.bind(mMemberEntityList.get(position));
            if (entity.isSelf()) {
                entity.getRoomVideoView().refreshParent();
            } else {
                processVideoPlay(position);
            }
        }
    }

    private void updateMultiConversationView(int position, String payload) {
        ViewHolder viewHolder = mViewHolderMap.get(position);
        if (viewHolder == null) {
            return;
        }
        MemberEntity entity = mMemberEntityList.get(position);
        if (QUALITY.equals(payload)) {
            viewHolder.setQuality(entity.getQuality());
        } else if (VOLUME.equals(payload)) {
            if (viewHolder instanceof OtherViewHolder) {
                ((OtherViewHolder) viewHolder).setVolume(entity.isTalk());
            } else if (viewHolder instanceof SelfViewHolder) {
                ((SelfViewHolder) viewHolder).setVolume(entity.isTalk());
            }
        }
    }

    private ViewHolder initItemView(boolean isSelf) {
        View view = inflate(mContext, R.layout.tuiroom_item_member, null);
        if (isSelf) {
            return new SelfViewHolder(view);
        } else {
            return new OtherViewHolder(view);
        }
    }

    private void initViewHolder(int index) {
        int itemId;
        switch (index) {
            case 0:
                itemId = R.id.item1;
                break;
            case 1:
                itemId = R.id.item2;
                break;
            case 2:
                itemId = R.id.item3;
                break;
            case 3:
                itemId = R.id.item4;
                break;
            case 4:
                itemId = R.id.item5;
                break;
            default:
                itemId = 0;
        }
        MemberEntity entity = mMemberEntityList.get(index);
        ViewHolder viewHolder = createViewHolder(itemId, entity);
        mViewHolderMap.put(index, viewHolder);
        RoomVideoView roomVideoView = entity.getRoomVideoView();
        if (entity.isSelf()) {
            roomVideoView.refreshParent();
        } else {
            processVideoPlay(index);
        }
    }

    private void initViewHolder(int index, int itemId) {
        MemberEntity entity = mMemberEntityList.get(index);
        ViewHolder viewHolder = createViewHolder(itemId, entity);
        mViewHolderMap.put(index, viewHolder);
        RoomVideoView roomVideoView = entity.getRoomVideoView();
        if (entity.isSelf()) {
            roomVideoView.refreshParent();
        } else {
            processVideoPlay(index);
        }
    }

    private void initMultiConversationView(int layoutId) {
        mViewHolderMap.clear();
        mCircleIndicator.setVisibility(GONE);
        mRecyclerView.setVisibility(GONE);
        mMultiConversation.setVisibility(VISIBLE);
        mMultiConversation.removeAllViews();
        inflate(mContext, layoutId, mMultiConversation);
        for (int i = 0; i < mMemberEntityList.size(); i++) {
            initViewHolder(i);
        }
    }

    private ViewHolder createViewHolder(int id, MemberEntity entity) {
        ViewHolder viewHolder = initItemView(entity.isSelf());
        viewHolder.bind(entity);
        ViewGroup group = findViewById(id);
        group.removeAllViews();
        group.addView(viewHolder.mItemView);
        return viewHolder;
    }

    private void showListView() {
        if (!isShareScreen()) {
            mRecyclerView.setVisibility(VISIBLE);
            mCircleIndicator.setVisibility(VISIBLE);
            mMultiConversation.removeAllViews();
            mMultiConversation.setVisibility(GONE);
        }
        if (mMemberListAdapter == null) {
            mMemberListAdapter = new MemberListAdapter(mContext, mMemberEntityList);
            mRecyclerView.setHasFixedSize(true);
            mPageLayoutManager = new RoomPageLayoutManager(2, 3,
                    RoomPageLayoutManager.HORIZONTAL);
            mPageLayoutManager.setAllowContinuousScroll(false);
            mPageLayoutManager.setPageListener(new RoomPageLayoutManager.PageListener() {
                @Override
                public void onPageSizeChanged(int pageSize) {

                }

                @Override
                public void onPageSelect(int pageIndex) {

                }

                @Override
                public void onItemVisible(int fromItem, int toItem) {
                    Log.d(TAG, "onItemVisible: " + fromItem + " to " + toItem);
                    if (fromItem == 0) {
                        processVideoPlay(0, toItem);
                    } else {
                        processVideoPlay(fromItem, toItem);
                    }
                }
            });
            mRecyclerView.setLayoutManager(mPageLayoutManager);
            mRecyclerView.setAdapter(mMemberListAdapter);
            mCircleIndicator.setPageNum(getPageNumber());
            mRecyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
                @Override
                public void onScrollStateChanged(RecyclerView recyclerView, int newState) {
                    super.onScrollStateChanged(recyclerView, newState);
                    updateScrollIndicator();
                }
            });
            PagerSnapHelper pagerSnapHelper = new PagerSnapHelper();
            pagerSnapHelper.attachToRecyclerView(mRecyclerView);
        }
    }

    private void updateScrollIndicator() {
        int position = mPageLayoutManager.findFirstVisibleItemPosition();
        int pageNum = getPageNumber();
        if (pageNum > 1) {
            int indicatorIndex = (position / MAX_ITEM_COUNT) % pageNum;
            if (position % MAX_ITEM_COUNT > 0) {
                indicatorIndex = indicatorIndex == pageNum ? 0 : indicatorIndex + 1;
            }
            mCircleIndicator.onPageScrolled(indicatorIndex, 0.0f);
        }
    }

    private int getPageNumber() {
        int itemCount = mMemberEntityList.size();
        return itemCount % MAX_ITEM_COUNT == 0 ? itemCount / MAX_ITEM_COUNT : itemCount / MAX_ITEM_COUNT + 1;
    }

    private void processSelfVideoPlay(MemberEntity selfMemberEntity) {
        if (selfMemberEntity.isShowOutSide()) {
            return;
        }
        RoomVideoView roomVideoView = selfMemberEntity.getRoomVideoView();
        roomVideoView.refreshParent();
    }

    /**
     * Process items to be displayed on the page. If you scroll to a new page, the playback of all items on the
     * previous page needs to be stopped. Whether a playback page is required for the new page is determined based on
     * whether video is enabled.
     *
     * @param fromItem
     * @param toItem
     */
    private void processVideoPlay(int fromItem, int toItem) {
        List<String> newUserIds = new ArrayList<>();
        if (mVisibleVideoStreams == null) {
            mVisibleVideoStreams = new ArrayList<>();
        }
        for (int i = fromItem; i <= toItem; i++) {
            MemberEntity entity = mMemberEntityList.get(i);
            if (entity.isSelf()) {
                processSelfVideoPlay(entity);
            } else {
                newUserIds.add(entity.getUserId());
                handleVisibleStream(entity);
            }
        }
        for (String userId : mVisibleVideoStreams) {
            if (!newUserIds.contains(userId)) {
                if (mListener != null) {
                    mListener.onViewStopPlay(userId);
                }
            }
        }
        mVisibleVideoStreams = newUserIds;
    }

    private void processVideoPlay(int index) {
        List<String> newUserIds = new ArrayList<>();
        MemberEntity entity = mMemberEntityList.get(index);
        newUserIds.add(entity.getUserId());
        handleVisibleStream(entity);
    }

    private void handleVisibleStream(MemberEntity entity) {
        if (entity.isShowOutSide()) {
            return;
        }
        RoomVideoView roomVideoView = entity.getRoomVideoView();
        roomVideoView.refreshParent();
        if (entity.isNeedFresh()) {
            entity.setNeedFresh(false);
            if (entity.isVideoAvailable()) {
                roomVideoView.setPlaying(true);
                if (mListener != null) {
                    mListener.onViewStart(entity.getUserId(), entity.getRoomVideoView().getPlayVideoView(),
                            entity.isScreenShareAvailable());
                }
            } else {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mListener != null) {
                        mListener.onViewStop(entity.getUserId(), entity.isScreenShareAvailable());
                    }
                }
            }
            return;
        }
        if (mVisibleVideoStreams == null) {
            return;
        }
        if (!mVisibleVideoStreams.contains(entity.getUserId())) {
            if (entity.isVideoAvailable()) {
                if (!roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(true);
                    if (mListener != null) {
                        mListener.onViewStart(entity.getUserId(), entity.getRoomVideoView().getPlayVideoView(),
                                entity.isScreenShareAvailable());
                    }
                    roomVideoView.refreshParent();
                }
            } else {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mListener != null) {
                        mListener.onViewStop(entity.getUserId(), entity.isScreenShareAvailable());
                    }
                }
            }
        } else {
            if (!entity.isVideoAvailable()) {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mListener != null) {
                        mListener.onViewStop(entity.getUserId(), entity.isScreenShareAvailable());
                    }
                }
            }
        }
    }

    public void setListener(Listener listener) {
        mListener = listener;
    }

    public void notifyItemChanged(int position, String payload) {
        if (isShowList()) {
            if (mMemberListAdapter != null) {
                mMemberListAdapter.notifyItemChanged(position, payload);
            }
        } else {
            updateMultiConversationView(position, payload);
        }
    }

    public void notifyItemChanged(int position) {
        if (isShowList()) {
            if (mMemberListAdapter != null) {
                mMemberListAdapter.notifyItemChanged(position);
            }
        } else {
            updateMultiConversationView(position);
        }
    }

    public void notifyItemChanged(int position, boolean changeSort) {
        if (isShowList()) {
            if (mMemberListAdapter != null) {
                if (changeSort) {
                    mMemberListAdapter.notifyDataSetChanged();
                } else {
                    mMemberListAdapter.notifyItemChanged(position);
                }
            }
        } else {
            if (changeSort) {
                initView();
            } else {
                updateMultiConversationView(position);
            }
        }
    }

    public void notifyItemInserted(int position) {
        if (isShowList()) {
            showListView();
            if (mMemberListAdapter != null) {
                if (mShowListView) {
                    mMemberListAdapter.notifyItemInserted(position);
                } else {
                    mMemberListAdapter.notifyDataSetChanged();
                }
                mShowListView = true;
            }
            updateCircleIndicator();
        } else {
            initView();
            mShowListView = false;
        }
    }

    public void notifyItemRemoved(int position, String userId) {
        mShareScreenList.remove(userId);
        if (isShowList()) {
            showListView();
            if (mMemberListAdapter != null) {
                mMemberListAdapter.notifyItemRemoved(position);
            }
            updateCircleIndicator();
            mShowListView = true;
        } else {
            initView();
            mShowListView = false;
        }
    }

    private void updateCircleIndicator() {
        if (mCircleIndicator != null) {
            mCircleIndicator.setVisibility(isShareScreen() ? GONE : VISIBLE);
            int pageNum = getPageNumber();
            mCircleIndicator.setPageNum(getPageNumber());
            if (pageNum > 1) {
                updateScrollIndicator();
            } else {
                mCircleIndicator.setVisibility(GONE);
            }
        }
    }

    public void notifyScreenShare(boolean available, MemberEntity entity) {
        if (available) {
            mShareScreenList.add(entity.getUserId());
            initScreenShareView(mMemberEntityList.indexOf(entity));
        } else {
            mShareScreenList.remove(entity.getUserId());
            initView();
        }
    }

    public boolean isShareScreen() {
        return !mShareScreenList.isEmpty();
    }

    public interface Listener {
        void onViewStart(String userId, TXCloudVideoView txCloudVideoView, boolean isSharingScreen);

        void onViewStop(String userId, boolean isSharingScreen);

        void onViewStopPlay(String userId);
    }

    public class SelfViewHolder extends ViewHolder {
        private RoomVideoView mViewVideo;
        private MemberEntity  mMemberEntity;

        private Runnable mRunnable = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public SelfViewHolder(View itemView) {
            super(itemView);
        }

        public MemberEntity getMemberEntity() {
            return mMemberEntity;
        }

        public FrameLayout getVideoContainer() {
            return mVideoContainer;
        }

        public RoomVideoView getViewVideo() {
            return mViewVideo;
        }

        public void setVolume(boolean isTalk) {
            mTalkView.setVisibility(isTalk ? VISIBLE : GONE);
            if (isTalk) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void hideTalkView() {
            mTalkView.setVisibility(GONE);
        }

        public void removeVideoView() {
            mVideoContainer.removeAllViews();
        }

        public void bind(final MemberEntity model) {
            mMemberEntity = model;
            mUserNameTv.setText(model.getUserName());
            ImageLoader.loadImage(mContext, mUserHeadImg, model.getUserAvatar(), R.drawable.tuiroom_head);
            mMemberEntity.getRoomVideoView().setWaitBindGroup(mVideoContainer);
            mVideoContainer.removeAllViews();
            if (model.isVideoAvailable()) {
                mVideoContainer.setVisibility(View.VISIBLE);
                mUserHeadImg.setVisibility(View.GONE);
            } else {
                mVideoContainer.setVisibility(View.GONE);
                mUserHeadImg.setVisibility(View.VISIBLE);
            }
            if (model.getQuality() == MemberEntity.QUALITY_GOOD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_3);
            } else if (model.getQuality() == MemberEntity.QUALITY_NORMAL) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_2);
            } else if (model.getQuality() == MemberEntity.QUALITY_BAD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_1);
            } else {
                mUserSignal.setVisibility(View.GONE);
            }
            mIvMaster.setVisibility(model.getRole() == TUIRoomCoreDef.Role.MASTER ? VISIBLE : GONE);
            mUserInfoGroup.setVisibility(model.isScreenShareAvailable() ? GONE : VISIBLE);
        }
    }

    public class OtherViewHolder extends ViewHolder {
        private MemberEntity mMemberEntity;
        private Runnable     mRunnable = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public OtherViewHolder(View itemView) {
            super(itemView);
        }

        public void setVolume(boolean isTalk) {
            mTalkView.setVisibility(isTalk ? VISIBLE : GONE);
            if (isTalk) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void hideTalkView() {
            mTalkView.setVisibility(GONE);
        }

        public void bind(final MemberEntity model) {
            mMemberEntity = model;
            RoomVideoView videoView = mMemberEntity.getRoomVideoView();
            if (videoView != null) {
                videoView.setWaitBindGroup(mVideoContainer);
            }
            mVideoContainer.removeAllViews();
            ImageLoader.loadImage(mContext, mUserHeadImg, model.getUserAvatar(), R.drawable.tuiroom_head);
            mUserNameTv.setText(model.getUserName());
            if (model.getQuality() == MemberEntity.QUALITY_GOOD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_3);
            } else if (model.getQuality() == MemberEntity.QUALITY_NORMAL) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_2);
            } else if (model.getQuality() == MemberEntity.QUALITY_BAD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_1);
            } else {
                mUserSignal.setVisibility(View.GONE);
            }
            mIvMaster.setVisibility(model.getRole() == TUIRoomCoreDef.Role.MASTER ? VISIBLE : GONE);
            mUserInfoGroup.setVisibility(model.isScreenShareAvailable() ? GONE : VISIBLE);
        }
    }

    public class ViewHolder {
        protected View            mItemView;
        protected TextView        mUserNameTv;
        protected CircleImageView mUserHeadImg;
        protected FrameLayout     mVideoContainer;
        protected ImageView       mUserSignal;
        protected ImageView       mIvMaster;
        protected View            mUserInfoGroup;
        protected View            mTalkView;

        public ViewHolder(View itemView) {
            mItemView = itemView;
            initView(itemView);
        }

        private void initView(final View itemView) {
            mUserNameTv = (TextView) itemView.findViewById(R.id.tv_user_name);
            mVideoContainer = (FrameLayout) itemView.findViewById(R.id.fl_container);
            mUserHeadImg = (CircleImageView) itemView.findViewById(R.id.img_user_head);
            mUserSignal = (ImageView) itemView.findViewById(R.id.img_signal);
            mIvMaster = (ImageView) itemView.findViewById(R.id.img_master);
            mUserInfoGroup = itemView.findViewById(R.id.user_info_group);
            mTalkView = itemView.findViewById(R.id.talk_view);
        }

        public void setMarginBottom(int dp) {
            RelativeLayout.LayoutParams params = (RelativeLayout.LayoutParams) mUserInfoGroup.getLayoutParams();
            params.bottomMargin = SizeUtils.dp2px(dp);
            mUserInfoGroup.setLayoutParams(params);
        }

        protected void bind(MemberEntity model) {

        }

        protected void setQuality(int quality) {
            if (quality == MemberEntity.QUALITY_GOOD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_3);
            } else if (quality == MemberEntity.QUALITY_NORMAL) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_2);
            } else if (quality == MemberEntity.QUALITY_BAD) {
                mUserSignal.setVisibility(View.VISIBLE);
                mUserSignal.setImageResource(R.drawable.tuiroom_ic_signal_1);
            } else {
                mUserSignal.setVisibility(View.GONE);
            }
        }
    }

    private boolean isShowList() {
        if (mMemberEntityList == null) {
            return false;
        }
        return mMemberEntityList.size() > 5;
    }
}
