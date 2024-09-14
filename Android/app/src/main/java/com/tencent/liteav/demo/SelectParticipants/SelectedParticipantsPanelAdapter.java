package com.tencent.liteav.demo.SelectParticipants;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.constraintlayout.utils.widget.ImageFilterView;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.demo.R;
import com.tencent.cloud.tuikit.roomkit.common.utils.ImageLoader;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.User;

import java.util.ArrayList;
import java.util.List;

public class SelectedParticipantsPanelAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private Context           mContext;
    private LayoutInflater mLayoutInflater;
    private List<User>     mSelectedParticipant = new ArrayList<>();

    public SelectedParticipantsPanelAdapter(Context context) {
        mContext = context;
        mLayoutInflater = LayoutInflater.from(context);
    }

    public void setSelectedParticipant(List<User> list) {
        mSelectedParticipant = new ArrayList<>(list);
    }

    public void addSelectedParticipant(User participant) {
        if (mSelectedParticipant.contains(participant)) {
            return;
        }
        mSelectedParticipant.add(participant);
        notifyItemChanged(mSelectedParticipant.size());
    }

    public void removeSelectedParticipant(User participant) {
        if (mSelectedParticipant.contains(participant)) {
            int position = mSelectedParticipant.indexOf(participant);
            mSelectedParticipant.remove(participant);
            notifyItemRemoved(position);
        }
    }

    public List<User> getSelectedParticipant() {
        return new ArrayList<>(mSelectedParticipant);
    }

    public int getSelectedParticipantsSize() {
        return mSelectedParticipant.size();
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = mLayoutInflater.inflate(R.layout.app_item_selected_participant_avatar, parent, false);
        return new ParticipantAvatarViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        User item = mSelectedParticipant.get(position);
        if (holder instanceof ParticipantAvatarViewHolder) {
            ((ParticipantAvatarViewHolder) holder).bind(item);
        }
    }

    @Override
    public int getItemCount() {
        return mSelectedParticipant.size();
    }

    private class ParticipantAvatarViewHolder extends RecyclerView.ViewHolder {
        private ImageFilterView mParticipantAvatar;

        public ParticipantAvatarViewHolder(@NonNull View itemView) {
            super(itemView);
            mParticipantAvatar = itemView.findViewById(R.id.img_selected_participant_avatar);
        }

        public void bind(User item) {
            ImageLoader.loadImage(mContext, mParticipantAvatar, item.avatarUrl, R.drawable.app_ic_avatar);
        }
    }
}
