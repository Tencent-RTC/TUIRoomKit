package com.tencent.liteav.demo.SelectParticipants;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.constraintlayout.utils.widget.ImageFilterView;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.demo.R;
import com.tencent.cloud.tuikit.roomkit.common.utils.ImageLoader;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.User;

import java.util.ArrayList;
import java.util.List;

public class MoreParticipantsAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private       List<User> mSelectedParticipants;
    private final Context    mContext;
    private final LayoutInflater            mLayoutInflater;
    private       deleteParticipantCallback mCallback;

    public MoreParticipantsAdapter(Context context, List<User> list) {
        this.mContext = context;
        this.mLayoutInflater = LayoutInflater.from(mContext);
        mSelectedParticipants = new ArrayList<>(list);
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View contentView = mLayoutInflater.inflate(R.layout.app_item_more_participants, parent, false);
        return new ViewHolderAttendee(contentView);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        User user = mSelectedParticipants.get(position);
        if (holder instanceof ViewHolderAttendee) {
            ((ViewHolderAttendee) holder).bind(user);
        }
    }

    @Override
    public int getItemCount() {
        return mSelectedParticipants.size();
    }

    private class ViewHolderAttendee extends RecyclerView.ViewHolder {
        private ImageFilterView mImgAvatar;
        private TextView        mUserName;
        private FrameLayout     mFlDeleteParticipant;

        public ViewHolderAttendee(@NonNull View itemView) {
            super(itemView);
            initView(itemView);
        }

        private void initView(View itemView) {
            mFlDeleteParticipant = itemView.findViewById(R.id.fl_delete_participant);
            mImgAvatar = itemView.findViewById(R.id.img_participant_avatar);
            mUserName = itemView.findViewById(R.id.tv_participant_name);
        }

        public void bind(User user) {
            ImageLoader.loadImage(mContext, mImgAvatar, user.avatarUrl, R.drawable.app_ic_avatar);
            mUserName.setText(user.userName);
            mFlDeleteParticipant.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    mCallback.onParticipantDeleted(user);
                }
            });
        }
    }

    public void setParticipantDeletedCallback(deleteParticipantCallback callback) {
        mCallback = callback;
    }

    public interface deleteParticipantCallback {
        void onParticipantDeleted(User participant);
    }

    public void removeParticipantItem(User participant) {
        if (mSelectedParticipants.contains(participant)) {
            int index = mSelectedParticipants.indexOf(participant);
            mSelectedParticipants.remove(participant);
            notifyItemRemoved(index);
        }
    }

    public int getDeletedParticipantsSize() {
        return mSelectedParticipants.size();
    }
}
