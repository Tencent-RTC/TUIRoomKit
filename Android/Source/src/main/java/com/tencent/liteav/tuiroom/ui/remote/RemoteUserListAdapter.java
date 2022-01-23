package com.tencent.liteav.tuiroom.ui.remote;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.appcompat.widget.AppCompatImageButton;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.basic.ImageLoader;
import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.ui.RemoteEntity;

import java.util.ArrayList;
import java.util.List;

import de.hdodenhof.circleimageview.CircleImageView;

public class RemoteUserListAdapter extends
        RecyclerView.Adapter<RemoteUserListAdapter.ViewHolder> {

    private static final String TAG = RemoteUserListAdapter.class.getSimpleName();

    private Context             mContext;
    private List<RemoteEntity>  mList = new ArrayList<>();
    private OnItemClickListener mOnItemClickListener;
    private boolean         mIsOwner;

    public RemoteUserListAdapter(Context context, OnItemClickListener onItemClickListener) {
        this.mContext = context;
        this.mOnItemClickListener = onItemClickListener;
    }

    public void setMemberList(List<RemoteEntity> list) {
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
            mHeadImg = (CircleImageView) itemView.findViewById(R.id.img_head);
            mUserNameTv = (TextView) itemView.findViewById(R.id.tv_user_name);
            mAudioImg = (AppCompatImageButton) itemView.findViewById(R.id.img_audio);
            mVideoImg = (AppCompatImageButton) itemView.findViewById(R.id.img_video);
            mKickUser = (AppCompatImageButton) itemView.findViewById(R.id.img_kick_user);
        }

        public void bind(Context context, final RemoteEntity model, final OnItemClickListener listener) {
            ImageLoader.loadImage(context, mHeadImg, model.userAvatar, R.drawable.tuiroom_head);
            mUserNameTv.setText(model.userName);
            mAudioImg.setSelected(model.isAudioAvailable);
            mVideoImg.setSelected(model.isVideoAvailable);
            mAudioImg.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onMuteAudioClick(model.userId);
                }
            });
            mVideoImg.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onMuteVideoClick(model.userId);
                }
            });
            mKickUser.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    listener.onKickUserClick(model.userId);
                }
            });
            mKickUser.setVisibility(mIsOwner ? View.VISIBLE : View.GONE);
        }
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        Context context = parent.getContext();
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.tuiroom_item_remote_user_list, parent, false);
        ViewHolder viewHolder = new ViewHolder(view);
        return viewHolder;
    }


    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        RemoteEntity item = mList.get(position);
        holder.bind(mContext, item, mOnItemClickListener);
    }


    @Override
    public int getItemCount() {
        return mList.size();
    }

    public interface OnItemClickListener {
        void onMuteAudioClick(String userId);

        void onMuteVideoClick(String userId);

        void onKickUserClick(String userId);
    }

}