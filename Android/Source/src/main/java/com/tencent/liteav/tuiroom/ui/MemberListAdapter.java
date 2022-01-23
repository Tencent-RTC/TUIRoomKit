package com.tencent.liteav.tuiroom.ui;

import android.content.Context;
import android.util.Log;
import android.view.GestureDetector;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.basic.ImageLoader;
import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;

import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class MemberListAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    private static final String TAG = MemberListAdapter.class.getSimpleName();

    private static final int    TYPE_SELF    = 0;
    private static final int    TYPE_OTHER   = 1;
    public static final  String VOLUME       = "volume";
    public static final  String QUALITY      = "quality";
    public static final  String VIDEO_CHANGE = "video_change";

    private Context            context;
    private List<MemberEntity> list;

    public MemberListAdapter(Context context, List<MemberEntity> list) {
        this.context = context;
        this.list = list;
    }

    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        Context context = parent.getContext();
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.tuiroom_item_member, parent, false);
        if (viewType == TYPE_SELF) {
            return new SelfViewHolder(view);
        } else {
            return new OtherViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        Log.d(TAG, "onBindViewHolder: " + position);
        if (holder instanceof OtherViewHolder) {
            MemberEntity item = list.get(position);
            ((OtherViewHolder) holder).bind(item);
        } else if (holder instanceof SelfViewHolder) {
            MemberEntity item = list.get(position);
            ((SelfViewHolder) holder).bind(item);
        }
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position, List<Object> payloads) {
        if (payloads == null || payloads.size() == 0) {
            onBindViewHolder(holder, position);
        } else {
            if (QUALITY.equals(payloads.get(0))) {
                if (holder instanceof OtherViewHolder) {
                    MemberEntity item = list.get(position);
                    ((OtherViewHolder) holder).setQuality(item.getQuality());
                } else if (holder instanceof SelfViewHolder) {
                    MemberEntity item = list.get(position);
                    ((SelfViewHolder) holder).setQuality(item.getQuality());
                }
            } else if (VOLUME.equals(payloads.get(0))) {
                if (holder instanceof OtherViewHolder) {
                    MemberEntity item = list.get(position);
                    ((OtherViewHolder) holder).setVolume(item.isTalk());
                } else if (holder instanceof SelfViewHolder) {
                    MemberEntity item = list.get(position);
                    ((SelfViewHolder) holder).setVolume(item.isTalk());
                }
            }
        }
    }

    @Override
    public int getItemViewType(int position) {
        MemberEntity memberEntity = list.get(position);
        if (memberEntity != null) {
            if (memberEntity.isSelf()) {
                return TYPE_SELF;
            }
        }
        return TYPE_OTHER;
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    public class SelfViewHolder extends RecyclerView.ViewHolder {
        private   TextView        mUserNameTv;
        private   RoomVideoView   mViewVideo;
        private   CircleImageView mUserHeadImg;
        private   MemberEntity    mMemberEntity;
        private   FrameLayout     mVideoContainer;
        private   ImageView       mUserSignal;
        protected View            mTalkView;
        private   ImageView       mIvMaster;


        private Runnable mRunnable = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(View.GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public SelfViewHolder(View itemView) {
            super(itemView);
            initView(itemView);
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

        public void setQuality(int quality) {
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

        public void setVolume(boolean isTalk) {
            mTalkView.setVisibility(isTalk ? View.VISIBLE : View.GONE);
            if (isTalk) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void hideTalkView() {
            mTalkView.setVisibility(View.GONE);
        }

        public void removeVideoView() {
            mVideoContainer.removeAllViews();
        }

        public void bind(final MemberEntity model) {
            mMemberEntity = model;
            mUserNameTv.setText(model.getUserName());
            ImageLoader.loadImage(context, mUserHeadImg, model.getUserAvatar(), R.drawable.tuiroom_head);
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
            mIvMaster.setVisibility(model.getRole() == TUIRoomCoreDef.Role.MASTER ? View.VISIBLE : View.GONE);
        }

        private void initView(final View itemView) {
            mUserNameTv = (TextView) itemView.findViewById(R.id.tv_user_name);
            mUserHeadImg = (CircleImageView) itemView.findViewById(R.id.img_user_head);
            mVideoContainer = (FrameLayout) itemView.findViewById(R.id.fl_container);
            mUserSignal = (ImageView) itemView.findViewById(R.id.img_signal);
            mTalkView = itemView.findViewById(R.id.talk_view);
            mIvMaster = (ImageView) itemView.findViewById(R.id.img_master);
        }
    }

    public class OtherViewHolder extends RecyclerView.ViewHolder {
        private final GestureDetector mSimpleOnGestureListener = new GestureDetector(context,
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
        private       TextView        mUserNameTv;
        private       CircleImageView mUserHeadImg;
        private       MemberEntity    mMemberEntity;
        private       FrameLayout     mVideoContainer;
        private       ImageView       mUserSignal;
        protected     View            mTalkView;
        private       ImageView       mIvMaster;
        private       boolean         isPlaying                = false;
        private       Runnable        mRunnable                = new Runnable() {
            @Override
            public void run() {
                mTalkView.setVisibility(View.GONE);
                if (mMemberEntity != null) {
                    mMemberEntity.setTalk(false);
                }
            }
        };

        public OtherViewHolder(View itemView) {
            super(itemView);
            initView(itemView);
        }

        public void setQuality(int quality) {
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

        public void setVolume(boolean isTalk) {
            mTalkView.setVisibility(isTalk ? View.VISIBLE : View.GONE);
            if (isTalk) {
                mTalkView.removeCallbacks(mRunnable);
                mTalkView.postDelayed(mRunnable, 2000);
            }
        }

        public void hideTalkView() {
            mTalkView.setVisibility(View.GONE);
        }

        public void bind(final MemberEntity model) {
            mMemberEntity = model;
            Log.d(TAG, "bind: " + mMemberEntity.getUserId() + " mVideoContainer " + mVideoContainer);
            RoomVideoView videoView = mMemberEntity.getRoomVideoView();
            if (videoView != null) {
                videoView.setWaitBindGroup(mVideoContainer);
            }
            mVideoContainer.removeAllViews();
            //展示其他数据
            ImageLoader.loadImage(context, mUserHeadImg, model.getUserAvatar(), R.drawable.tuiroom_head);
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
            mIvMaster.setVisibility(model.getRole() == TUIRoomCoreDef.Role.MASTER ? View.VISIBLE : View.GONE);
            itemView.setOnTouchListener(new View.OnTouchListener() {
                @Override
                public boolean onTouch(View v, MotionEvent event) {
                    return mSimpleOnGestureListener.onTouchEvent(event);
                }
            });
        }

        private void initView(final View itemView) {
            mUserNameTv = (TextView) itemView.findViewById(R.id.tv_user_name);
            mVideoContainer = (FrameLayout) itemView.findViewById(R.id.fl_container);
            mUserHeadImg = (CircleImageView) itemView.findViewById(R.id.img_user_head);
            mUserSignal = (ImageView) itemView.findViewById(R.id.img_signal);
            mIvMaster = (ImageView) itemView.findViewById(R.id.img_master);
            mTalkView = itemView.findViewById(R.id.talk_view);
        }
    }

    public interface ListCallback {
        void onItemClick(int position);

        void onItemDoubleClick(int position);
    }
}