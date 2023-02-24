package com.tencent.cloud.tuikit.roomkit.view.component;

import android.content.Context;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import com.tencent.cloud.tuikit.roomkit.viewmodel.UserListViewModel;
import com.tencent.qcloud.tuicore.util.ToastUtil;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;

import java.util.List;

public class UserListView extends ConstraintLayout implements
        View.OnClickListener {

    private Context           mContext;
    private TextView          mBtnConfirm;
    private TextView          mMuteAudioAllBtn;
    private TextView          mMuteVideoAllBtn;
    private EditText          mEditSearch;
    private RecyclerView      mRecyclerUserList;
    private UserListAdapter   mUserListAdapter;
    private UserListViewModel mViewModel;

    public UserListView(Context context) {
        super(context);
        mContext = context;
        inflate(mContext, R.layout.tuiroomkit_view_room_remote_user_list, this);
        initView(this);
        mViewModel = new UserListViewModel(mContext, this);
        mUserListAdapter.setUserId(mViewModel.getSelfUserId());
    }

    @Override
    public void setVisibility(int visibility) {
        if (visibility == GONE) {
            mViewModel.horizontalAnimation(false);
        } else if (visibility == VISIBLE) {
            mViewModel.horizontalAnimation(true);
        }
        super.setVisibility(visibility);
    }

    public void setOwner(boolean isOwner) {
        mMuteAudioAllBtn.setVisibility(isOwner ? VISIBLE : GONE);
        mMuteVideoAllBtn.setVisibility(isOwner ? VISIBLE : GONE);
        mBtnConfirm.setVisibility(isOwner ? GONE : VISIBLE);
        mUserListAdapter.setOwner(isOwner);
        mUserListAdapter.notifyDataSetChanged();
    }

    public void addItem(UserModel userModel) {
        if (mUserListAdapter != null) {
            mUserListAdapter.addItem(userModel);
        }
    }

    public void removeItem(UserModel userModel) {
        if (mUserListAdapter != null) {
            mUserListAdapter.removeItem(userModel);
        }
    }

    public void updateItem(UserModel userModel) {
        if (mUserListAdapter != null) {
            mUserListAdapter.updateItem(userModel);
        }
    }

    private void initView(View itemView) {
        mMuteAudioAllBtn = itemView.findViewById(R.id.btn_mute_audio_all);
        mMuteVideoAllBtn = itemView.findViewById(R.id.btn_mute_video_all);
        mRecyclerUserList = itemView.findViewById(R.id.rv_user_list);
        mBtnConfirm = itemView.findViewById(R.id.btn_confirm);
        mEditSearch = itemView.findViewById(R.id.et_search);
        mMuteAudioAllBtn.setOnClickListener(this);
        mMuteVideoAllBtn.setOnClickListener(this);
        mBtnConfirm.setOnClickListener(this);
        findViewById(R.id.toolbar).setOnClickListener(this);

        mEditSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String userName = mEditSearch.getText().toString();
                if (TextUtils.isEmpty(userName)) {
                    mUserListAdapter.setDataList(mViewModel.getUserList());
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        });
        mEditSearch.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                    String userName = mEditSearch.getText().toString();
                    mUserListAdapter.setDataList(mViewModel.searchUserByName(userName));
                }
                return false;
            }
        });

        mRecyclerUserList.setLayoutManager(new LinearLayoutManager(mContext, LinearLayoutManager.VERTICAL, false));
        mUserListAdapter = new UserListAdapter(mContext);
        mRecyclerUserList.setAdapter(mUserListAdapter);
        mRecyclerUserList.setHasFixedSize(true);
    }

    public void updateMuteAudioView(boolean isMute) {
        if (isMute) {
            mMuteAudioAllBtn.setText(R.string.tuiroomkit_toast_not_mute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_text_red));
        } else {
            mMuteAudioAllBtn.setText(R.string.tuiroomkit_toast_mute_all_audio);
            mMuteAudioAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_text_light_grey));
        }
    }

    public void updateMuteVideoView(boolean isMute) {
        if (isMute) {
            mMuteVideoAllBtn.setText(R.string.tuiroomkit_toast_not_mute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_text_red));
        } else {
            mMuteVideoAllBtn.setText(R.string.tuiroomkit_toast_mute_all_video);
            mMuteVideoAllBtn.setTextColor(getResources().getColor(R.color.tuiroomkit_color_text_light_grey));
        }
    }

    public void disableMuteAllVideo(boolean disable) {
        if (disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_mute_all_camera_toast));
        } else {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_not_mute_all_video));
        }
    }

    public void disableMuteAllAudio(boolean disable) {
        if (disable) {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_mute_all_mic_toast));
        } else {
            ToastUtil.toastShortMessage(getContext().getString(R.string.tuiroomkit_toast_not_mute_all_audio));
        }
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
            mViewModel.muteAllUserAudio();
        } else if (v.getId() == R.id.btn_mute_video_all) {
            mViewModel.muteAllUserVideo();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mViewModel.destroy();
    }

    public void showUserManagementView(UserModel userModel) {
        UserManagementView userManagementView = new UserManagementView(mContext, userModel);
        userManagementView.show();
    }
}

