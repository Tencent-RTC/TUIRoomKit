package com.tencent.cloud.tuikit.videoseat.ui;


import static com.tencent.cloud.tuikit.videoseat.ui.utils.UserListAdapter.VOLUME;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.videoseat.R;
import com.tencent.cloud.tuikit.videoseat.ui.utils.ImageLoader;
import com.tencent.cloud.tuikit.videoseat.ui.utils.PageLayoutManager;
import com.tencent.cloud.tuikit.videoseat.ui.utils.PagerSnapHelper;
import com.tencent.cloud.tuikit.videoseat.ui.utils.UserListAdapter;
import com.tencent.cloud.tuikit.videoseat.ui.view.CircleIndicator;
import com.tencent.cloud.tuikit.videoseat.ui.view.RoundRelativeLayout;
import com.tencent.cloud.tuikit.videoseat.ui.view.UserVolumePromptView;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;
import com.tencent.cloud.tuikit.videoseat.viewmodel.IVideoSeatViewModel;
import com.tencent.cloud.tuikit.videoseat.viewmodel.UserEntity;
import com.tencent.cloud.tuikit.videoseat.viewmodel.VideoSeatViewModel;
import com.tencent.qcloud.tuicore.util.ScreenUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import de.hdodenhof.circleimageview.CircleImageView;

public class TUIVideoSeatView extends RelativeLayout {
    private static final String TAG = "AnchorListView";

    private static final int   MAX_ITEM_COUNT         = 6;
    private static final int[] LAYOUT_ROUND_ARR       = {
            R.layout.tuivideoseat_one_member_layout_round, R.layout.tuivideoseat_two_member_layout_round,
            R.layout.tuivideoseat_three_member_layout_round, R.layout.tuivideoseat_four_member_layout_round,
            R.layout.tuivideoseat_five_member_layout_round};
    private static final int[] LAYOUT_RECTANGULAR_ARR = {
            R.layout.tuivideoseat_one_member_layout_rectangular, R.layout.tuivideoseat_two_member_layout_rectangular,
            R.layout.tuivideoseat_three_member_layout_rectangular, R.layout.tuivideoseat_four_member_layout_rectangular,
            R.layout.tuivideoseat_five_member_layout_rectangular};

    private Context mContext;

    private ViewGroup         mMultiConversation;
    private RecyclerView      mRecyclerView;
    private UserListAdapter   mMemberListAdapter;
    private CircleIndicator   mCircleIndicator;
    private PageLayoutManager mPageLayoutManager;

    private Set<String>              mShareScreenList;
    private List<String>             mVisibleVideoStreams;
    private List<UserEntity>         mMemberEntityList;
    private Map<Integer, ViewHolder> mViewHolderMap;

    private OnClickListener     mSmallWindowTapListener;
    private IVideoSeatViewModel mViewModel;

    private boolean mShowListView;
    private boolean mIsLayoutStyleRound = true;

    private final int mUserVideoRoundRadius;

    public TUIVideoSeatView(Context context, String roomId, TUIRoomEngine roomEngine) {
        super(context);
        mContext = context;
        mViewHolderMap = new HashMap<>();
        mShareScreenList = new HashSet<>();
        inflate(mContext, R.layout.tuivideoseat_anchor_list_view, this);
        mRecyclerView = findViewById(R.id.rv_list);
        mMultiConversation = findViewById(R.id.multi_conversation);
        mCircleIndicator = findViewById(R.id.simple_view);
        int unSelectColor = getResources().getColor(R.color.tuivideoseat_color_indicator_un_select);
        int selectColor = getResources().getColor(R.color.tuivideoseat_color_white);
        mCircleIndicator.setSelectDotColor(selectColor);
        mCircleIndicator.setUnSelectDotColor(unSelectColor);
        init(roomId, roomEngine);

        mUserVideoRoundRadius = (int) context.getResources().getDimension(R.dimen.tuivideoseat_video_view_conor);
    }

    private void setData(List<UserEntity> list) {
        mMemberEntityList = list;
        if (mMemberEntityList.size() > 5) {
            return;
        }
        initView();
    }

    private void init(String roomId, TUIRoomEngine roomEngine) {
        mViewModel = new VideoSeatViewModel(mContext, roomEngine, this, roomId);
        setData(mViewModel.getData());
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mViewModel.destroy();
    }

    public void switchVideoLayout() {
        mIsLayoutStyleRound = !mIsLayoutStyleRound;
        initView();
        int size = mMemberEntityList.size();
        if (size < MAX_ITEM_COUNT) {
            ViewHolder holder;
            for (int i = 0; i < size; i++) {
                holder = mViewHolderMap.get(i);
                holder.switchTalkViewBackGround();
                holder.switchViewConor();
            }
        } else {
            if (mPageLayoutManager != null) {
                mPageLayoutManager.switchLayout(mIsLayoutStyleRound);
            }
            if (mMemberListAdapter != null) {
                mMemberListAdapter.switchLayout(mIsLayoutStyleRound);
            }
        }
    }

    private void initView() {
        if (mMemberEntityList == null) {
            return;
        }
        if (isShareScreen()) {
            return;
        }
        int size = mMemberEntityList.size();

        if (size >= MAX_ITEM_COUNT) {
            showListView();
            return;
        }
        int layoutId = mIsLayoutStyleRound ? LAYOUT_ROUND_ARR[size - 1] : LAYOUT_RECTANGULAR_ARR[size - 1];
        initMultiConversationView(layoutId);
        if (size == 1) {
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
        inflate(mContext, R.layout.tuivideoseat_anchor_list_view_screen_share, mMultiConversation);
        int selfIndex = 0;
        for (int i = 0; i < mMemberEntityList.size(); i++) {
            UserEntity entity = mMemberEntityList.get(i);
            if (entity.isSelf()) {
                selfIndex = i;
            }
        }
        initViewHolder(selfIndex, R.id.item1);
        initViewHolder(position, R.id.item2);
    }

    private void initTwoMemberView(int layoutId) {
        if (mMemberEntityList == null) {
            return;
        }
        mViewHolderMap.clear();
        mRecyclerView.setVisibility(GONE);
        mMultiConversation.setVisibility(VISIBLE);
        mMultiConversation.removeAllViews();
        final View rootView = inflate(mContext, layoutId, mMultiConversation);
        if (mSmallWindowTapListener == null) {
            mSmallWindowTapListener = new OnClickListener() {
                @Override
                public void onClick(View v) {
                    updateTwoConversationWindow(rootView);
                }
            };
        }
        for (int i = 0; i < mMemberEntityList.size(); i++) {
            UserEntity entity = mMemberEntityList.get(i);
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
        RelativeLayout selfLayout = rootView.findViewById(R.id.item1);
        RelativeLayout remoteLayout = rootView.findViewById(R.id.item2);
        RelativeLayout previousBigView;
        RelativeLayout previousSmallView;
        if (selfLayout.getHeight() > remoteLayout.getHeight()) {
            previousBigView = selfLayout;
            previousSmallView = remoteLayout;
        } else {
            previousBigView = remoteLayout;
            previousSmallView = selfLayout;
        }
        ViewGroup viewGroup = (ViewGroup) selfLayout.getParent();
        viewGroup.removeAllViews();
        ConstraintLayout.LayoutParams smallParams = new ConstraintLayout.LayoutParams(ScreenUtil.dip2px(96),
                ScreenUtil.dip2px(170));
        smallParams.width = ScreenUtil.dip2px(96);
        smallParams.height = ScreenUtil.dip2px(170);
        smallParams.rightToRight = R.id.rl_content;
        smallParams.topToTop = R.id.rl_content;
        smallParams.topMargin = ScreenUtil.dip2px(92);

        RelativeLayout transferBigLayout = previousSmallView;
        RelativeLayout transferSmallLayout = previousBigView;
        ConstraintLayout.LayoutParams bigParams = new ConstraintLayout.LayoutParams(
                ConstraintLayout.LayoutParams.MATCH_PARENT, ConstraintLayout.LayoutParams.MATCH_PARENT);
        transferBigLayout.setLayoutParams(bigParams);
        transferSmallLayout.setLayoutParams(smallParams);
        viewGroup.addView(transferBigLayout);
        viewGroup.addView(transferSmallLayout);

        View bigUserInfoGroup = transferBigLayout.findViewById(R.id.user_info_group);
        LayoutParams bigUserInfoParams =
                (LayoutParams) bigUserInfoGroup.getLayoutParams();
        bigUserInfoParams.bottomMargin = ScreenUtil.dip2px(92);
        bigUserInfoGroup.setLayoutParams(bigUserInfoParams);

        View smallUserInfoGroup = transferSmallLayout.findViewById(R.id.user_info_group);
        LayoutParams smallUserInfoParams =
                (LayoutParams) smallUserInfoGroup.getLayoutParams();
        smallUserInfoParams.bottomMargin = 0;
        smallUserInfoGroup.setLayoutParams(smallUserInfoParams);
        transferBigLayout.setOnClickListener(null);
        transferSmallLayout.setOnClickListener(mSmallWindowTapListener);
    }

    private void updateMultiConversationView(int position) {
        ViewHolder viewHolder = mViewHolderMap.get(position);
        if (viewHolder != null) {
            UserEntity entity = mMemberEntityList.get(position);
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
        UserEntity entity = mMemberEntityList.get(position);
        if (VOLUME.equals(payload)) {
            viewHolder.showTalking(entity.isTalk());
            viewHolder.updateVolumeEffect(entity.getAudioVolume());
        }
    }

    private ViewHolder initItemView() {
        View view = inflate(mContext, R.layout.tuivideoseat_item_member, null);
        return new ViewHolder(view);
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
        UserEntity entity = mMemberEntityList.get(index);
        ViewHolder viewHolder = createViewHolder(itemId, entity);
        mViewHolderMap.put(index, viewHolder);
        VideoView roomVideoView = entity.getRoomVideoView();
        if (entity.isSelf()) {
            roomVideoView.refreshParent();
        } else {
            processVideoPlay(index);
        }
    }

    private void initViewHolder(int index, int itemId) {
        UserEntity entity = mMemberEntityList.get(index);
        ViewHolder viewHolder = createViewHolder(itemId, entity);
        mViewHolderMap.put(index, viewHolder);
        VideoView roomVideoView = entity.getRoomVideoView();
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

    private ViewHolder createViewHolder(int id, UserEntity entity) {
        ViewHolder viewHolder = initItemView();
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
            mMemberListAdapter = new UserListAdapter(mContext, mMemberEntityList);
            mRecyclerView.setHasFixedSize(true);
            mPageLayoutManager = new PageLayoutManager(3, 2,
                    PageLayoutManager.HORIZONTAL);
            mPageLayoutManager.setAllowContinuousScroll(false);
            mPageLayoutManager.setPageListener(new PageLayoutManager.PageListener() {
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

    private void processSelfVideoPlay(UserEntity selfMemberEntity) {
        if (selfMemberEntity.isShowOutSide()) {
            return;
        }
        VideoView roomVideoView = selfMemberEntity.getRoomVideoView();
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
            UserEntity entity = mMemberEntityList.get(i);
            if (entity.isSelf()) {
                processSelfVideoPlay(entity);
            } else {
                newUserIds.add(entity.getUserId());
                handleVisibleStream(entity);
            }
        }
        for (String userId : mVisibleVideoStreams) {
            if (!newUserIds.contains(userId)) {
                if (mViewModel != null) {
                    mViewModel.stopPlayVideo(userId, false, false);
                }
            }
        }
        mVisibleVideoStreams = newUserIds;
    }

    private void processVideoPlay(int index) {
        List<String> newUserIds = new ArrayList<>();
        UserEntity entity = mMemberEntityList.get(index);
        newUserIds.add(entity.getUserId());
        handleVisibleStream(entity);
    }

    private void handleVisibleStream(UserEntity entity) {
        if (entity.isShowOutSide()) {
            return;
        }
        VideoView roomVideoView = entity.getRoomVideoView();
        roomVideoView.refreshParent();
        if (entity.isNeedFresh()) {
            entity.setNeedFresh(false);
            if (entity.isVideoAvailable()) {
                roomVideoView.setPlaying(true);
                if (mViewModel != null) {
                    mViewModel.startPlayVideo(entity.getUserId(),
                            entity.getRoomVideoView().getPlayVideoView(),
                            entity.isScreenShareAvailable());
                }
            } else {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mViewModel != null) {
                        mViewModel.stopPlayVideo(entity.getUserId(), entity.isScreenShareAvailable(), true);
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
                    if (mViewModel != null) {
                        mViewModel.startPlayVideo(entity.getUserId(),
                                entity.getRoomVideoView().getPlayVideoView(),
                                entity.isScreenShareAvailable());
                    }
                    roomVideoView.refreshParent();
                }
            } else {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mViewModel != null) {
                        mViewModel.stopPlayVideo(entity.getUserId(), entity.isScreenShareAvailable(), true);
                    }
                }
            }
        } else {
            if (!entity.isVideoAvailable()) {
                if (roomVideoView.isPlaying()) {
                    roomVideoView.setPlaying(false);
                    if (mViewModel != null) {
                        mViewModel.stopPlayVideo(entity.getUserId(), entity.isScreenShareAvailable(), true);
                    }
                }
            }
        }
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

    public void notifyScreenShare(boolean available, UserEntity entity) {
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

    public class ViewHolder {
        protected View                 mUserInfoGroup;
        protected View                 mTalkView;
        protected View                 mItemView;
        private   View                 mViewBackground;
        protected TextView             mUserNameTv;
        protected UserVolumePromptView mUserMic;
        protected ImageView            mIvMaster;
        protected CircleImageView      mUserHeadImg;
        protected FrameLayout          mVideoContainer;
        private   UserEntity           mMemberEntity;
        private   Runnable             mRunnable = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public ViewHolder(View itemView) {
            mItemView = itemView;
            initView(itemView);
        }

        private void initView(final View itemView) {
            switchViewConor();
            mUserNameTv = itemView.findViewById(R.id.tv_user_name);
            mVideoContainer = itemView.findViewById(R.id.fl_container);
            mUserHeadImg = itemView.findViewById(R.id.img_user_head);
            mUserMic = itemView.findViewById(R.id.tuivideoseat_user_mic);
            mIvMaster = itemView.findViewById(R.id.img_master);
            mUserInfoGroup = itemView.findViewById(R.id.user_info_group);
            mTalkView = itemView.findViewById(R.id.talk_view);
            switchTalkViewBackGround();
            mViewBackground = itemView.findViewById(R.id.view_background);
        }

        public void setMarginBottom(int dp) {
            LayoutParams params = (LayoutParams) mUserInfoGroup.getLayoutParams();
            params.bottomMargin = ScreenUtil.dip2px(dp);
            mUserInfoGroup.setLayoutParams(params);
        }

        public void updateVolumeEffect(int volume) {
            mUserMic.updateVolumeEffect(volume);
        }

        private void enableVolumeEffect(boolean enable) {
            mUserMic.enableVolumeEffect(enable);
        }

        public void switchViewConor() {
            int conor = mIsLayoutStyleRound ? mUserVideoRoundRadius : 0;
            RoundRelativeLayout layout = mItemView.findViewById(R.id.rl_content);
            layout.setRadius(conor);
        }

        public void switchTalkViewBackGround() {
            int backGroundId = mIsLayoutStyleRound ? R.drawable.tuivideoseat_talk_bg_round :
                    R.drawable.tuivideoseat_talk_bg_rectangular;
            mTalkView.setBackground(mContext.getResources().getDrawable(backGroundId));
        }

        public void showTalking(boolean isTalking) {
            mTalkView.setVisibility(isTalking ? VISIBLE : GONE);
            if (isTalking) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void hideTalkView() {
            mTalkView.setVisibility(GONE);
        }

        public void bind(final UserEntity entity) {
            mMemberEntity = entity;
            VideoView videoView = mMemberEntity.getRoomVideoView();
            if (videoView != null) {
                videoView.setWaitBindGroup(mVideoContainer);
            }
            ImageLoader.loadImage(mContext, mUserHeadImg, entity.getUserAvatar(), R.drawable.tuivideoseat_head);
            mUserHeadImg.setVisibility(entity.isVideoAvailable() ? GONE : VISIBLE);
            mViewBackground.setVisibility(entity.isVideoAvailable() ? GONE : VISIBLE);
            mUserNameTv.setText(entity.getUserName());
            enableVolumeEffect(entity.isAudioAvailable());
            updateVolumeEffect(entity.getAudioVolume());
            mIvMaster.setVisibility(entity.getRole() == TUIRoomDefine.Role.ROOM_OWNER ? VISIBLE : GONE);
            mUserInfoGroup.setVisibility(entity.isScreenShareAvailable() ? GONE : VISIBLE);
        }
    }

    private boolean isShowList() {
        if (mMemberEntityList == null) {
            return false;
        }
        return mMemberEntityList.size() > 5;
    }
}
