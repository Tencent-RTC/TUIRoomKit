package com.tencent.cloud.tuikit.roomkit.view;

import android.content.Context;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.text.TextUtils;
import android.view.MotionEvent;
import android.view.View;
import android.widget.TextView;

import com.tencent.qcloud.tuicore.util.ToastUtil;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class UserListView extends ConstraintLayout implements View.OnClickListener {

    private Context          mContext;
    private TextView         mBtnConfirm;
    private TextView         mMuteAudioAllBtn;
    private TextView         mMuteVideoAllBtn;
    private RecyclerView     mUserListRv;
    private List<UserEntity> mUserEntityList = new ArrayList<>();
    private UserListAdapter  mTUIUserListAdapter;

    private boolean mIsOwner;
    private boolean mMuteAllAudio;
    private boolean mMuteAllVideo;
    private boolean mDisableMuteAllVideoClick;
    private boolean mDisableMuteAllAudioClick;
    private boolean mDisableKickUserClick;

    private OnUserListItemClickListener mListener;

    public UserListView(Context context) {
        super(context);
        mContext = context;
        inflate(mContext, R.layout.tuiroomkit_view_room_remote_user_list, this);
        initView(this);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        super.onTouchEvent(event);
        return true;
    }

    public void setOwner(boolean isOwner) {
        mIsOwner = isOwner;
        mMuteAudioAllBtn.setVisibility(mIsOwner ? VISIBLE : GONE);
        mMuteVideoAllBtn.setVisibility(mIsOwner ? VISIBLE : GONE);
        mBtnConfirm.setVisibility(mIsOwner ? GONE : VISIBLE);
        mTUIUserListAdapter.setOwner(isOwner);
        mTUIUserListAdapter.notifyDataSetChanged();
    }


    private void initView(View itemView) {
        mMuteAudioAllBtn = itemView.findViewById(R.id.btn_mute_audio_all);
        mMuteVideoAllBtn = itemView.findViewById(R.id.btn_mute_video_all);
        mUserListRv = itemView.findViewById(R.id.rv_user_list);
        mBtnConfirm = itemView.findViewById(R.id.btn_confirm);
        mMuteAudioAllBtn.setOnClickListener(this);
        mMuteVideoAllBtn.setOnClickListener(this);
        mBtnConfirm.setOnClickListener(this);
        findViewById(R.id.toolbar).setOnClickListener(this);
        mUserListRv.setLayoutManager(new LinearLayoutManager(mContext, LinearLayoutManager.VERTICAL, false));
        mTUIUserListAdapter = new UserListAdapter(mContext, new UserListAdapter.OnItemClickListener() {
            @Override
            public void onMuteAudioClick(String userId) {
                if (!mIsOwner) {
                    return;
                }
                UserEntity entity = findUserEntity(userId);
                if (entity == null) {
                    return;
                }
                if (!mMuteAllAudio && !entity.isAudioAvailable()) {
                    return;
                }
                if (mListener != null) {
                    mListener.onMuteUserAudio(entity.isAudioAvailable(), userId);
                }
            }

            @Override
            public void onMuteVideoClick(String userId) {
                if (!mIsOwner) {
                    return;
                }
                // 非全体禁画，点击解除禁画不响应
                UserEntity entity = findUserEntity(userId);
                if (entity == null) {
                    return;
                }
                if (!mMuteAllVideo && !entity.isVideoAvailable()) {
                    return;
                }
                if (mListener != null) {
                    mListener.onMuteUserVideo(entity.isVideoAvailable(), userId);
                }
            }

            @Override
            public void onKickUserClick(String userId, String userName) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableKickUserClick) {
                    return;
                }
                disableKickUser(true);
                if (mListener != null) {
                    mListener.onKickUser(userId, userName);
                }
            }
        });
        mTUIUserListAdapter.setOwner(mIsOwner);
        mTUIUserListAdapter.setMemberList(mUserEntityList);
        mUserListRv.setAdapter(mTUIUserListAdapter);
        mUserListRv.setHasFixedSize(true);
        updateMuteAudioView();
        updateMuteVideoView();
    }

    public void setRemoteUser(List<UserEntity> memberEntityList) {
        mUserEntityList.clear();
        for (UserEntity entity : memberEntityList) {
            mUserEntityList.add(entity);
        }
        Collections.sort(mUserEntityList, new Comparator<UserEntity>() {
            @Override
            public int compare(UserEntity o1, UserEntity o2) {
                if (o1.isMaster()) {
                    return -1;
                }
                return 1;
            }
        });
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.setMemberList(mUserEntityList);
        }
    }

    public void addRemoteUser(UserEntity memberEntity) {
        UserEntity entity = findUserEntity(memberEntity.getUserId());
        if (entity != null) {
            return;
        }
        mUserEntityList.add(memberEntity);
        Collections.sort(mUserEntityList, new Comparator<UserEntity>() {
            @Override
            public int compare(UserEntity o1, UserEntity o2) {
                if (o1.isMaster()) {
                    return -1;
                }
                return 1;
            }
        });
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.notifyDataSetChanged();
        }
    }

    public void removeRemoteUser(String userId) {
        UserEntity userEntity = findUserEntity(userId);
        if (userEntity == null) {
            return;
        }
        mUserEntityList.remove(userEntity);
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserVideo(String userId, boolean available) {
        UserEntity userEntity = findUserEntity(userId);
        if (userEntity == null) {
            return;
        }
        userEntity.setVideoAvailable(available);
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserInfo(String userId, String userName, String userAvatar) {
        UserEntity userEntity = findUserEntity(userId);
        if (userEntity == null) {
            return;
        }
        userEntity.setUserId(userId);
        userEntity.setUserName(userName);
        userEntity.setUserAvatar(userAvatar);
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserAudio(String userId, boolean available) {
        UserEntity userEntity = findUserEntity(userId);
        if (userEntity == null) {
            return;
        }
        userEntity.setAudioAvailable(available);
        if (mTUIUserListAdapter != null) {
            mTUIUserListAdapter.notifyDataSetChanged();
        }
    }

    private UserEntity findUserEntity(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return null;
        }
        for (UserEntity entity : mUserEntityList) {
            if (entity == null) {
                continue;
            }
            if (userId.equals(entity.getUserId())) {
                return entity;
            }
        }
        return null;
    }

    private void updateMuteAudioView() {
        if (mMuteAllAudio) {
            mMuteAudioAllBtn.setText(R.string.tuiroomkit_toast_not_mute_all_audio);
            mMuteAudioAllBtn.setBackgroundResource(R.drawable.tuiroomkit_bg_unmute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_white));
        } else {
            mMuteAudioAllBtn.setText(R.string.tuiroomkit_toast_mute_all_audio);
            mMuteAudioAllBtn.setBackgroundResource(R.drawable.tuiroomkit_bg_mute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_green));
        }
    }

    private void updateMuteVideoView() {
        if (mMuteAllVideo) {
            mMuteVideoAllBtn.setText(R.string.tuiroomkit_toast_not_mute_all_video);
            mMuteVideoAllBtn.setBackgroundResource(R.drawable.tuiroomkit_bg_unmute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_white));
        } else {
            mMuteVideoAllBtn.setText(R.string.tuiroomkit_toast_mute_all_video);
            mMuteVideoAllBtn.setBackgroundResource(R.drawable.tuiroomkit_bg_mute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_blue));
        }
    }

    public void disableMuteAllVideo(boolean disable) {
        if (disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_mute_all_video));
        } else {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_not_mute_all_video));
        }
        mDisableMuteAllVideoClick = false;
    }

    public void disableMuteAllAudio(boolean disable) {
        if (disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_mute_all_audio));
        } else {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_not_mute_all_audio));
        }
        mDisableMuteAllAudioClick = false;
    }

    public void disableMuteAudio(boolean disable) {
        if (!disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_un_mute_audio_success));
        }
    }

    public void disableMuteVideo(boolean disable) {
        if (!disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_un_mute_video_success));
        }
    }


    public void disableKickUser(boolean disable) {
        mDisableKickUserClick = disable;
    }


    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.btn_confirm) {
            if (isShown()) {
                setVisibility(GONE);
            } else {
                setVisibility(VISIBLE);
            }
        } else if (v.getId() == R.id.toolbar) {
            setVisibility(GONE);
        } else if (v.getId() == R.id.btn_mute_audio_all) {
            if (!mIsOwner) {
                return;
            }
            if (mDisableMuteAllAudioClick) {
                return;
            }
            mDisableMuteAllAudioClick = true;
            mMuteAllAudio = !mMuteAllAudio;
            if (mListener != null) {
                mListener.onMuteAllUserAudio(mMuteAllAudio);
            }
            updateMuteAudioView();
        } else if (v.getId() == R.id.btn_mute_video_all) {
            if (!mIsOwner) {
                return;
            }
            if (mDisableMuteAllVideoClick) {
                return;
            }
            mDisableMuteAllVideoClick = true;
            mMuteAllVideo = !mMuteAllVideo;
            if (mListener != null) {
                mListener.onMuteAllUserVideo(mMuteAllVideo);
            }
            updateMuteVideoView();
        }
    }

    public void setOnItemClickListener(OnUserListItemClickListener listener) {
        mListener = listener;
    }

    public interface OnUserListItemClickListener {
        void onMuteUserAudio(boolean mute, String userId);

        void onMuteUserVideo(boolean mute, String userId);

        void onMuteAllUserAudio(boolean mute);

        void onMuteAllUserVideo(boolean mute);

        void onKickUser(String userId, String userName);
    }

}

