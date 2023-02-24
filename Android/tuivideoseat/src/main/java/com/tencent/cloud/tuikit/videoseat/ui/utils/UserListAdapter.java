package com.tencent.cloud.tuikit.videoseat.ui.utils;

import static android.view.View.GONE;
import static android.view.View.VISIBLE;

import android.content.Context;
import android.view.GestureDetector;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.videoseat.R;
import com.tencent.cloud.tuikit.videoseat.ui.view.UserVolumePromptView;
import com.tencent.cloud.tuikit.videoseat.ui.view.RoundRelativeLayout;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;
import com.tencent.cloud.tuikit.videoseat.viewmodel.UserEntity;

import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class UserListAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_SELF  = 0;
    private static final int TYPE_OTHER = 1;

    public static final String VOLUME  = "volume";
    public static final String QUALITY = "quality";

    private Context mContext;

    private List<UserEntity> mList;

    private boolean mIsLayoutStyleRound = true;

    private final int mRoundConor;

    public UserListAdapter(Context context, List<UserEntity> list) {
        this.mContext = context;
        this.mList = list;
        mRoundConor = (int) context.getResources().getDimension(R.dimen.tuivideoseat_video_view_conor);
    }

    public void switchLayout(boolean isLayoutStyleRound) {
        mIsLayoutStyleRound = isLayoutStyleRound;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        Context context = parent.getContext();
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.tuivideoseat_item_member, parent, false);
        return new ViewHolder(view, viewType);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        UserEntity item = mList.get(position);
        ((ViewHolder) holder).bind(item);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position,
                                 @NonNull List<Object> payloads) {
        if (payloads.size() == 0) {
            onBindViewHolder(holder, position);
        } else {
            if (VOLUME.equals(payloads.get(0))) {
                UserEntity item = mList.get(position);
                ((ViewHolder) holder).setVolume(item.isTalk());
                ((ViewHolder) holder).updateVolumeEffect(item.getAudioVolume());
            }
        }
    }

    @Override
    public int getItemViewType(int position) {
        UserEntity memberEntity = mList.get(position);
        if (memberEntity != null) {
            if (memberEntity.isSelf()) {
                return TYPE_SELF;
            }
        }
        return TYPE_OTHER;
    }

    @Override
    public int getItemCount() {
        return mList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        private   int                  mViewType;
        protected View                 mTalkView;
        private   View                 mViewBackground;
        private   TextView             mUserNameTv;
        private   ImageView            mIvMaster;
        private   UserVolumePromptView mUserMic;
        private   CircleImageView      mUserHeadImg;
        private   UserEntity           mMemberEntity;
        private   FrameLayout          mVideoContainer;
        private   RoundRelativeLayout  mTopLayout;

        private final Runnable mRunnable = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public ViewHolder(View itemView, int type) {
            super(itemView);
            mViewType = type;
            initView(itemView);
        }

        private final GestureDetector mSimpleOnGestureListener = new GestureDetector(mContext,
                new GestureDetector.SimpleOnGestureListener() {

                    @Override
                    public boolean onSingleTapConfirmed(MotionEvent e) {
                        return true;
                    }

                    @Override
                    public boolean onDoubleTap(MotionEvent e) {
                        return true;
                    }

                    @Override
                    public boolean onDown(MotionEvent e) {
                        return true;
                    }
                });

        public void updateVolumeEffect(int volume) {
            mUserMic.updateVolumeEffect(volume);
        }

        public void enableVolumeEffect(boolean enable) {
            mUserMic.enableVolumeEffect(enable);
        }

        public void setVolume(boolean isTalk) {
            mTalkView.setVisibility(isTalk ? VISIBLE : GONE);
            if (isTalk) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void bind(final UserEntity model) {
            mMemberEntity = model;
            VideoView videoView = mMemberEntity.getRoomVideoView();
            if (videoView != null) {
                videoView.setWaitBindGroup(mVideoContainer);
            }
            mViewBackground.setVisibility(model.isVideoAvailable() ? GONE : VISIBLE);
            mUserHeadImg.setVisibility(model.isVideoAvailable() ? GONE : VISIBLE);
            ImageLoader.loadImage(mContext, mUserHeadImg, model.getUserAvatar(), R.drawable.tuivideoseat_head);
            mUserNameTv.setText(model.getUserName());
            enableVolumeEffect(model.isAudioAvailable());
            updateVolumeEffect(model.getAudioVolume());
            mIvMaster.setVisibility(model.getRole() == TUIRoomDefine.Role.ROOM_OWNER ? VISIBLE : GONE);
            if (mViewType == TYPE_SELF) {
                itemView.setOnTouchListener(new View.OnTouchListener() {
                    @Override
                    public boolean onTouch(View v, MotionEvent event) {
                        return mSimpleOnGestureListener.onTouchEvent(event);
                    }
                });
            }

            mTopLayout.setRadius(mIsLayoutStyleRound ? mRoundConor : 0);
            int backGroundId = mIsLayoutStyleRound ? R.drawable.tuivideoseat_talk_bg_round :
                    R.drawable.tuivideoseat_talk_bg_rectangular;
            mTalkView.setBackground(mContext.getResources().getDrawable(backGroundId));
        }

        private void initView(final View itemView) {
            mTopLayout = itemView.findViewById(R.id.rl_content);
            mUserNameTv = itemView.findViewById(R.id.tv_user_name);
            mVideoContainer = itemView.findViewById(R.id.fl_container);
            mUserHeadImg = itemView.findViewById(R.id.img_user_head);
            mUserMic = itemView.findViewById(R.id.tuivideoseat_user_mic);
            mIvMaster = itemView.findViewById(R.id.img_master);
            mTalkView = itemView.findViewById(R.id.talk_view);
            mViewBackground = itemView.findViewById(R.id.view_background);
        }
    }
}