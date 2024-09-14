package com.tencent.liteav.demo.SelectParticipants;

import android.content.Context;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.liteav.demo.R;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.User;

import java.util.List;
import java.util.Locale;

public class MoreParticipantsPopView extends BottomSheetDialog {
    private Context                      mContext;
    private RecyclerView                 mRvAttendeesView;
    private TextView                     mTvSelectedAttendeeTitle;
    private MoreParticipantsAdapter      mAdapter;
    private onParticipantDeletedCallback mDeletedParticipantCallback;
    private ImageView                    mImgDismissDialog;

    public MoreParticipantsPopView(@NonNull Context context) {
        super(context, R.style.TUIRoomDialogFragmentTheme);
        setContentView(R.layout.app_view_more_participants);
        mContext = context;
        initView();
    }

    public void setAttendees(List<User> participants) {
        String text = String.format(Locale.getDefault(), getContext().getString(R.string.app_format_select_participant), mContext.getString(R.string.app_selected_text), participants.size());
        mTvSelectedAttendeeTitle.setText(text);
        mAdapter = new MoreParticipantsAdapter(mContext, participants);
        mRvAttendeesView.setAdapter(mAdapter);
        mAdapter.setParticipantDeletedCallback(new MoreParticipantsAdapter.deleteParticipantCallback() {
            @Override
            public void onParticipantDeleted(User participant) {
                mAdapter.removeParticipantItem(participant);
                if (mDeletedParticipantCallback != null) {
                    mDeletedParticipantCallback.onParticipantDelete(participant);
                }
                String text = String.format(Locale.getDefault(), getContext().getString(R.string.app_format_select_participant), mContext.getString(R.string.app_selected_text), mAdapter.getDeletedParticipantsSize());
                mTvSelectedAttendeeTitle.setText(text);
            }
        });
    }

    private void initView() {
        mImgDismissDialog = findViewById(R.id.img_arrow_down);
        mImgDismissDialog.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dismiss();
            }
        });
        mTvSelectedAttendeeTitle = findViewById(R.id.tv_selected_participant_count_title);
        mRvAttendeesView = findViewById(R.id.rv_attendee_list);
        mRvAttendeesView.setLayoutManager(new LinearLayoutManager(mContext));
    }

    public void setDeleteParticipantCallback(onParticipantDeletedCallback callback) {
        mDeletedParticipantCallback = callback;
    }

    public interface onParticipantDeletedCallback {
        void onParticipantDelete(User user);
    }
}
