package com.tencent.liteav.demo.SelectParticipants;

import android.content.Context;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.constraintlayout.utils.widget.ImageFilterView;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.roomkit.common.utils.ImageLoader;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.User;
import com.tencent.liteav.demo.R;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class SelectParticipantAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private Context                    mContext;
    private LayoutInflater             mLayoutInflater;
    private List<SelectedParticipant>  mFriendList = new ArrayList<>();
    private ParticipantChangedCallback mCallback;

    public SelectParticipantAdapter(Context context, ArrayList<User> list, ArrayList<User> selectedList, ArrayList<User> disableList) {
        mContext = context;
        mLayoutInflater = LayoutInflater.from(context);
        for (User user : list) {
            SelectedParticipant participant = new SelectedParticipant();
            participant.userInfo = user;
            participant.isSelected = selectedList.contains(user);
            participant.isDisable = disableList.contains(user);
            mFriendList.add(participant);
        }
    }

    public interface ParticipantChangedCallback {
        void onSelectParticipantChanged(User participant, boolean isSelect);
    }

    public void setParticipantChangedCallback(ParticipantChangedCallback callback) {
        mCallback = callback;
    }

    public void setFriendList(List<SelectedParticipant> list) {
        mFriendList = new ArrayList<>(list);
        notifyDataSetChanged();
    }

    public void updateParticipantSelectionStatus(User user) {
        for (SelectedParticipant participant : mFriendList) {
            if (TextUtils.equals(participant.userInfo.userId, user.userId)) {
                participant.isSelected = false;
                int index = mFriendList.indexOf(participant);
                notifyItemChanged(index);
            }
        }
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = mLayoutInflater.inflate(R.layout.app_view_select_participant_item, parent, false);
        return new ParticipantViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        SelectedParticipant item = mFriendList.get(position);
        if (holder instanceof ParticipantViewHolder) {
            ((ParticipantViewHolder) holder).bind(item);
        }
    }

    @Override
    public int getItemCount() {
        return mFriendList.size();
    }

    private class ParticipantViewHolder extends RecyclerView.ViewHolder {
        private ImageFilterView  mImgAvatar;
        private TextView         mUserName;
        private FrameLayout      mFlSelectUserTag;
        private ConstraintLayout mItemLayout;

        public ParticipantViewHolder(@NonNull View itemView) {
            super(itemView);
            initView(itemView);
        }

        private void initView(View itemView) {
            mItemLayout = itemView.findViewById(R.id.cl_select_participant_item);
            mImgAvatar = itemView.findViewById(R.id.img_attendee_avatar);
            mUserName = itemView.findViewById(R.id.tv_attendee_name);
            mFlSelectUserTag = itemView.findViewById(R.id.cb_select_user_button);
        }

        public void bind(SelectedParticipant item) {
            String userName = String.format(Locale.getDefault(), mContext.getString(R.string.app_participant_name_and_id), item.userInfo.userName, item.userInfo.userId);
            mUserName.setText(userName);
            ImageLoader.loadImage(mContext, mImgAvatar, item.userInfo.avatarUrl, R.drawable.app_ic_avatar);
            mFlSelectUserTag.setBackgroundResource(item.isSelected || item.isDisable ? R.drawable.app_bg_attendee_selected : R.drawable.app_bg_attendee_unselected);
            mItemLayout.setAlpha(item.isDisable ? (float) 0.5 : 1);
            mItemLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (item.isDisable) {
                        return;
                    }
                    item.isSelected = !item.isSelected;
                    mFlSelectUserTag.setBackgroundResource(item.isSelected ? R.drawable.app_bg_attendee_selected : R.drawable.app_bg_attendee_unselected);
                    if (mCallback != null) {
                        mCallback.onSelectParticipantChanged(item.userInfo, item.isSelected);
                    }
                }
            });
        }
    }
}
