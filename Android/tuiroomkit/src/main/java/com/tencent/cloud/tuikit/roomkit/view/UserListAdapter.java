package com.tencent.cloud.tuikit.roomkit.view;

import android.content.Context;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.widget.AppCompatImageButton;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.basic.ImageLoader;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;

import java.util.ArrayList;
import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class UserListAdapter extends
        RecyclerView.Adapter<UserListAdapter.ViewHolder> {

    private Context             mContext;
    private List<UserEntity>    mList = new ArrayList<>();
    private OnItemClickListener mOnItemClickListener;
    private boolean             mIsOwner;

    public UserListAdapter(Context context, OnItemClickListener onItemClickListener) {
        this.mContext = context;
        this.mOnItemClickListener = onItemClickListener;
    }

    public void setMemberList(List<UserEntity> list) {
        this.mList = list;
        notifyDataSetChanged();
    }

    public void setOwner(boolean isOwner) {
        mIsOwner = isOwner;
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        private CircleImageView      mHeadImg;
        private TextView             mUserNameTv;
        private AppCompatImageButton mAudioImg;
        private AppCompatImageButton mVideoImg;
        private AppCompatImageButton mKickUser;

        public ViewHolder(View itemView) {
            super(itemView);
            initView(itemView);
        }

        private void initView(final View itemView) {
            mHeadImg = itemView.findViewById(R.id.img_head);
            mUserNameTv = itemView.findViewById(R.id.tv_user_name);
            mAudioImg = itemView.findViewById(R.id.img_audio);
            mVideoImg = itemView.findViewById(R.id.img_video);
            mKickUser = itemView.findViewById(R.id.img_kick_user);
        }

        public void bind(Context context, final UserEntity model, final OnItemClickListener listener) {
            ImageLoader.loadImage(context, mHeadImg, model.getUserAvatar(), R.drawable.tuiroomkit_head);
            String userName = model.getUserName();
            if (TextUtils.isEmpty(userName)) {
                userName = model.getUserId();
            }
            mUserNameTv.setText(userName);
            mAudioImg.setSelected(model.isAudioAvailable());
            mVideoImg.setSelected(model.isVideoAvailable());
            mAudioImg.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onMuteAudioClick(model.getUserId());
                }
            });
            mVideoImg.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onMuteVideoClick(model.getUserId());
                }
            });
            mKickUser.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onKickUserClick(model.getUserId(), model.getUserName());
                }
            });
            mKickUser.setVisibility(mIsOwner ? View.VISIBLE : View.GONE);
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        Context context = parent.getContext();
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.tuiroomkit_item_remote_user_list, parent, false);
        return new ViewHolder(view);
    }


    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        UserEntity item = mList.get(position);
        holder.bind(mContext, item, mOnItemClickListener);
    }


    @Override
    public int getItemCount() {
        return mList.size();
    }

    public interface OnItemClickListener {
        void onMuteAudioClick(String userId);

        void onMuteVideoClick(String userId);

        void onKickUserClick(String userId, String userName);
    }

}