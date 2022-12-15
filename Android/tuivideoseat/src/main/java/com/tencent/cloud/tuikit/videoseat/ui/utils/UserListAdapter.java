package com.tencent.cloud.tuikit.videoseat.ui.utils;

import static android.view.View.GONE;
import static android.view.View.VISIBLE;
import static com.tencent.cloud.tuikit.videoseat.model.UserEntity.QUALITY_BAD;
import static com.tencent.cloud.tuikit.videoseat.model.UserEntity.QUALITY_GOOD;
import static com.tencent.cloud.tuikit.videoseat.model.UserEntity.QUALITY_NORMAL;

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
import com.tencent.cloud.tuikit.videoseat.model.UserEntity;
import com.tencent.cloud.tuikit.videoseat.ui.view.VideoView;

import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class UserListAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final int TYPE_SELF  = 0;
    private static final int TYPE_OTHER = 1;

    public static final String VOLUME  = "volume";
    public static final String QUALITY = "quality";

    private Context mContext;

    private List<UserEntity> mList;

    public UserListAdapter(Context context, List<UserEntity> list) {
        this.mContext = context;
        this.mList = list;
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
            if (QUALITY.equals(payloads.get(0))) {
                UserEntity item = mList.get(position);
                ((ViewHolder) holder).setQuality(item.getQuality());
            } else if (VOLUME.equals(payloads.get(0))) {
                UserEntity item = mList.get(position);
                ((ViewHolder) holder).setVolume(item.isTalk());
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
        private   int             mViewType;
        protected View            mTalkView;
        private   View            mViewBackground;
        private   TextView        mUserNameTv;
        private   ImageView       mUserSignal;
        private   ImageView       mIvMaster;
        private   CircleImageView mUserHeadImg;
        private   UserEntity      mMemberEntity;
        private   FrameLayout     mVideoContainer;

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

        public void setQuality(int quality) {
            switch (quality) {
                case QUALITY_GOOD:
                    mUserSignal.setVisibility(VISIBLE);
                    mUserSignal.setImageResource(R.drawable.tuivideoseat_ic_signal_3);
                    break;
                case QUALITY_NORMAL:
                    mUserSignal.setVisibility(VISIBLE);
                    mUserSignal.setImageResource(R.drawable.tuivideoseat_ic_signal_2);
                    break;
                case QUALITY_BAD:
                    mUserSignal.setVisibility(VISIBLE);
                    mUserSignal.setImageResource(R.drawable.tuivideoseat_ic_signal_1);
                    break;
                default:
                    mUserSignal.setVisibility(GONE);
                    break;
            }
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
            setQuality(model.getQuality());
            mIvMaster.setVisibility(model.getRole() == TUIRoomDefine.Role.ROOM_OWNER ? VISIBLE : GONE);
            if (mViewType == TYPE_SELF) {
                itemView.setOnTouchListener(new View.OnTouchListener() {
                    @Override
                    public boolean onTouch(View v, MotionEvent event) {
                        return mSimpleOnGestureListener.onTouchEvent(event);
                    }
                });
            }
        }

        private void initView(final View itemView) {
            mUserNameTv = itemView.findViewById(R.id.tv_user_name);
            mVideoContainer = itemView.findViewById(R.id.fl_container);
            mUserHeadImg = itemView.findViewById(R.id.img_user_head);
            mUserSignal = itemView.findViewById(R.id.img_signal);
            mIvMaster = itemView.findViewById(R.id.img_master);
            mTalkView = itemView.findViewById(R.id.talk_view);
            mViewBackground = itemView.findViewById(R.id.view_background);
        }
    }
}