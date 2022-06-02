package com.tencent.liteav.tuiroom.ui.remote;

import android.content.Context;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.appcompat.widget.Toolbar;

import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.widget.TextView;

import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;
import com.tencent.liteav.tuiroom.ui.MemberEntity;
import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.ui.RemoteEntity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class RemoteUserListView extends ConstraintLayout {
    private final Context mContext;

    private TextView               mTitleMain;
    private Toolbar                mToolbar;
    private TextView               mMuteAudioAllBtn;
    private TextView               mMuteVideoAllBtn;
    private RecyclerView           mUserListRv;
    private TextView               mBtnConfirm;
    private List<RemoteEntity>     mRemoteEntityList = new ArrayList<>();
    private RemoteUserListAdapter  mRemoteUserListAdapter;
    private RemoteUserListCallback mRemoteUserListCallback;
    private boolean                mMuteAllAudio;
    private boolean                mMuteAllVideo;
    private boolean                mDisableMuteAllVideoClick;
    private boolean                mDisableMuteAllAudioClick;
    private boolean                mDisableMuteVideoClick;
    private boolean                mDisableMuteAudioClick;
    private boolean                mDisableKickUserClick;
    private boolean                mIsOwner;
    private String                 mSelfUserId;

    public RemoteUserListView(Context context) {
        this(context, null);
    }

    public RemoteUserListView(Context context, AttributeSet attrs) {
        super(context, attrs);
        mContext = context;
        inflate(mContext, R.layout.tuiroom_view_room_remote_user_list, this);
        initView(this);
    }


    public void init(String selfUserId, boolean isOwner) {
        mSelfUserId = selfUserId;
        mIsOwner = isOwner;
        setOwner(mIsOwner);
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
        mRemoteUserListAdapter.setOwner(isOwner);
        mRemoteUserListAdapter.notifyDataSetChanged();
    }

    private void initView(View itemView) {
        mTitleMain = (TextView) itemView.findViewById(R.id.main_title);
        mToolbar = (Toolbar) itemView.findViewById(R.id.toolbar);
        mMuteAudioAllBtn = (TextView) itemView.findViewById(R.id.btn_mute_audio_all);
        mMuteVideoAllBtn = (TextView) itemView.findViewById(R.id.btn_mute_video_all);
        mUserListRv = (RecyclerView) itemView.findViewById(R.id.rv_user_list);
        mBtnConfirm = (TextView) itemView.findViewById(R.id.btn_confirm);
        mBtnConfirm.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mRemoteUserListCallback != null) {
                    mRemoteUserListCallback.onConfirmButtonClick();
                }
            }
        });
        mToolbar.setNavigationOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mRemoteUserListCallback != null) {
                    mRemoteUserListCallback.onFinishClick();
                }
            }
        });
        mUserListRv.setLayoutManager(new LinearLayoutManager(mContext, LinearLayoutManager.VERTICAL, false));
        mRemoteUserListAdapter = new RemoteUserListAdapter(mContext, new RemoteUserListAdapter.OnItemClickListener() {
            @Override
            public void onMuteAudioClick(String userId) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableMuteAudioClick) {
                    return;
                }
                if (mRemoteUserListCallback != null) {
                    mRemoteUserListCallback.onMuteAudioClick(userId);
                }
            }

            @Override
            public void onMuteVideoClick(String userId) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableMuteVideoClick) {
                    return;
                }
                if (mRemoteUserListCallback != null) {
                    mRemoteUserListCallback.onMuteVideoClick(userId);
                }
            }

            @Override
            public void onKickUserClick(String userId) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableKickUserClick) {
                    return;
                }
                if (mRemoteUserListCallback != null) {
                    mRemoteUserListCallback.onKickUserClick(userId);
                }
            }
        });
        mRemoteUserListAdapter.setOwner(mIsOwner);
        mRemoteUserListAdapter.setMemberList(mRemoteEntityList);
        mUserListRv.setAdapter(mRemoteUserListAdapter);
        mUserListRv.setHasFixedSize(true);

        updateMuteAudioView();
        updateMuteVideoView();

        mMuteAudioAllBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableMuteAllAudioClick) {
                    return;
                }
                if (mRemoteUserListCallback != null) {
                    mMuteAllAudio = !mMuteAllAudio;
                    if (mMuteAllAudio) {
                        mRemoteUserListCallback.onMuteAllAudioClick();
                    } else {
                        mRemoteUserListCallback.onMuteAllAudioOffClick();
                    }
                    updateMuteAudioView();
                }
            }
        });

        mMuteVideoAllBtn.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!mIsOwner) {
                    return;
                }
                if (mDisableMuteAllVideoClick) {
                    return;
                }
                if (mRemoteUserListCallback != null) {
                    mMuteAllVideo = !mMuteAllVideo;
                    if (mMuteAllVideo) {
                        mRemoteUserListCallback.onMuteAllVideoClick();
                    } else {
                        mRemoteUserListCallback.onMuteAllVideoOffClick();
                    }
                    updateMuteVideoView();
                }
            }
        });
    }

    public void setRemoteUser(List<MemberEntity> memberEntityList) {
        mRemoteEntityList.clear();
        for (MemberEntity entity : memberEntityList) {
            if (entity.getUserId().equals(mSelfUserId)) {
                continue;
            }
            RemoteEntity remoteEntity = createRemoteUser(entity);
            mRemoteEntityList.add(remoteEntity);
        }
        Collections.sort(mRemoteEntityList, new Comparator<RemoteEntity>() {
            @Override
            public int compare(RemoteEntity o1, RemoteEntity o2) {
                if (o1.isMaster) {
                    return -1;
                }
                return 1;
            }
        });
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.setMemberList(mRemoteEntityList);
        }
    }

    public void addRemoteUser(MemberEntity memberEntity) {
        if (memberEntity.getUserId().equals(mSelfUserId)) {
            return;
        }
        RemoteEntity remoteEntity = createRemoteUser(memberEntity);
        mRemoteEntityList.add(remoteEntity);
        Collections.sort(mRemoteEntityList, new Comparator<RemoteEntity>() {
            @Override
            public int compare(RemoteEntity o1, RemoteEntity o2) {
                if (o1.isMaster) {
                    return -1;
                }
                return 1;
            }
        });
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.notifyDataSetChanged();
        }
    }

    public void removeRemoteUser(String userId) {
        RemoteEntity remoteEntity = findRemoteEntity(userId);
        if (remoteEntity == null) {
            return;
        }
        mRemoteEntityList.remove(remoteEntity);
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserVideo(String userId, boolean available) {
        RemoteEntity remoteEntity = findRemoteEntity(userId);
        if (remoteEntity == null) {
            return;
        }
        remoteEntity.isVideoAvailable = available;
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserInfo(String userId, String userName, String userAvatar) {
        RemoteEntity remoteEntity = findRemoteEntity(userId);
        if (remoteEntity == null) {
            return;
        }
        remoteEntity.userName = userName;
        remoteEntity.userName = userName;
        remoteEntity.userAvatar = userAvatar;
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.notifyDataSetChanged();
        }
    }

    public void updateRemoteUserAudio(String userId, boolean available) {
        RemoteEntity remoteEntity = findRemoteEntity(userId);
        if (remoteEntity == null) {
            return;
        }
        remoteEntity.isAudioAvailable = available;
        if (mRemoteUserListAdapter != null) {
            mRemoteUserListAdapter.notifyDataSetChanged();
        }
    }

    private RemoteEntity findRemoteEntity(String userId) {
        if (TextUtils.isEmpty(userId)) {
            return null;
        }
        for (RemoteEntity entity : mRemoteEntityList) {
            if (entity == null) {
                continue;
            }
            if (userId.equals(entity.userId)) {
                return entity;
            }
        }
        return null;
    }

    private RemoteEntity createRemoteUser(MemberEntity entity) {
        RemoteEntity remoteEntity = new RemoteEntity();
        remoteEntity.userId = entity.getUserId();
        remoteEntity.userName = entity.getUserName();
        remoteEntity.userAvatar = entity.getUserAvatar();
        remoteEntity.isVideoAvailable = entity.isVideoAvailable();
        remoteEntity.isAudioAvailable = entity.isAudioAvailable();
        remoteEntity.isMaster = entity.getRole() == TUIRoomCoreDef.Role.MASTER;
        return remoteEntity;
    }

    public void setRemoteUserListCallback(RemoteUserListCallback remoteUserListCallback) {
        mRemoteUserListCallback = remoteUserListCallback;
    }

    private void updateMuteAudioView() {
        if (mMuteAllAudio) {
            mMuteAudioAllBtn.setText(R.string.tuiroom_toast_not_mute_all_audio);
            mMuteAudioAllBtn.setBackgroundResource(R.drawable.tuiroom_bg_unmute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroom_color_white));
        } else {
            mMuteAudioAllBtn.setText(R.string.tuiroom_toast_mute_all_audio);
            mMuteAudioAllBtn.setBackgroundResource(R.drawable.tuiroom_bg_mute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroom_color_green));
        }
    }

    private void updateMuteVideoView() {
        if (mMuteAllVideo) {
            mMuteVideoAllBtn.setText(R.string.tuiroom_toast_not_mute_all_video);
            mMuteVideoAllBtn.setBackgroundResource(R.drawable.tuiroom_bg_unmute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroom_color_white));
        } else {
            mMuteVideoAllBtn.setText(R.string.tuiroom_toast_mute_all_video);
            mMuteVideoAllBtn.setBackgroundResource(R.drawable.tuiroom_bg_mute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroom_color_blue));
        }
    }

    public void disableMuteAllVideo(boolean disable) {
        mDisableMuteAllVideoClick = disable;
    }

    public void disableMuteAllAudio(boolean disable) {
        mDisableMuteAllAudioClick = disable;
    }

    public void disableMuteAudio(boolean disable) {
        mDisableMuteAudioClick = disable;
    }

    public void disableMuteVideo(boolean disable) {
        mDisableMuteVideoClick = disable;
    }


    public void disableKickUser(boolean disable) {
        mDisableKickUserClick = disable;
    }

    public interface RemoteUserListCallback {
        void onFinishClick();

        void onMuteAllAudioClick();

        void onMuteAllAudioOffClick();

        void onMuteAllVideoClick();

        void onMuteAllVideoOffClick();

        void onMuteAudioClick(String userId);

        void onMuteVideoClick(String userId);

        void onKickUserClick(String userId);

        void onConfirmButtonClick();
    }
}

