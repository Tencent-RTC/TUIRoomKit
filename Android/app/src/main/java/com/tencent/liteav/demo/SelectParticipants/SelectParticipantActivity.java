package com.tencent.liteav.demo.SelectParticipants;

import static com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.CustomSelector.CONFERENCE_PARTICIPANTS;
import static com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.CustomSelector.SELECTED_PARTICIPANTS;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.ConferenceParticipants;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.ScheduleConference.SelectScheduleParticipant.User;
import com.tencent.imsdk.v2.V2TIMFriendInfo;
import com.tencent.imsdk.v2.V2TIMManager;
import com.tencent.imsdk.v2.V2TIMValueCallback;
import com.tencent.liteav.demo.R;
import com.tencent.qcloud.tuicore.TUILogin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class SelectParticipantActivity extends AppCompatActivity {
    private static final String KEY_USER_ID              = "userId";
    private static final String KEY_USER_NAME            = "userName";
    private static final String KEY_USER_AVATAR          = "avatarUrl";
    private static final String MEMBERS_FILE_NAME        = "members.json";
    private static final int    MAX_VISIBLE_USER_AVATARS = 10;

    private Context                          mContext;
    private RecyclerView                     mRvContact;
    private RecyclerView                     mRvSelectedParticipant;
    private SelectParticipantAdapter         mSelectParticipantAdapter;
    private SelectedParticipantsPanelAdapter mSelectedParticipantsPanelAdapter;
    private TextView                         mTvParticipantsTitle;
    private TextView                         mMoreParticipantsTitle;
    private LinearLayout                     mMoreParticipantsLayout;
    private EditText                         mEtSearchParticipant;
    private ImageView                        mImgSelectFinish;
    private ArrayList<User>                  mSelectedList     = new ArrayList<>();
    private ArrayList<User>                  mUnSelectableList = new ArrayList<>();
    private Button                           mConfirmSelectButton;
    private MoreParticipantsPopView          mMoreParticipantsPopView;
    private ArrayList<User>                  mFriendList       = new ArrayList<>();


    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.app_activity_select_participant);
        mContext = this;
        setFriendListAndInitView(true);
    }

    public void setFriendListAndInitView(boolean isUseImData) {
        if (isUseImData) {
            setIMFriendListAndInitView();
            return;
        }
        setLocalFriendList();
        initView();
    }

    public void setIMFriendListAndInitView() {
        V2TIMManager.getFriendshipManager().getFriendList(new V2TIMValueCallback<List<V2TIMFriendInfo>>() {
            @Override
            public void onSuccess(List<V2TIMFriendInfo> v2TIMFriendInfos) {
                transIMFriendList(v2TIMFriendInfos);
                initView();
            }

            @Override
            public void onError(int code, String desc) {
            }
        });
    }


    public void transIMFriendList(List<V2TIMFriendInfo> list) {
        for (V2TIMFriendInfo participant : list) {
            User user = new User();
            user.userId = participant.getUserID();
            user.userName = participant.getUserProfile().getNickName();
            user.avatarUrl = participant.getUserProfile().getFaceUrl();
            mFriendList.add(user);
        }
    }

    public void setLocalFriendList() {
        String myUserId = TUILogin.getUserId();
        try {
            String jsonString = loadJSONFromAsset(MEMBERS_FILE_NAME);
            JSONArray jsonArray = new JSONArray(jsonString);
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject userObject = jsonArray.getJSONObject(i);
                User participant = new User();
                participant.userId = userObject.getString(KEY_USER_ID);
                participant.userName = userObject.getString(KEY_USER_NAME);
                participant.avatarUrl = userObject.getString(KEY_USER_AVATAR);
                if (!TextUtils.equals(participant.userId, myUserId)) {
                    mFriendList.add(participant);
                }
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public String loadJSONFromAsset(String fileName) {
        String json = null;
        try {
            InputStream file = mContext.getAssets().open(fileName);
            int size = file.available();
            byte[] buffer = new byte[size];
            file.read(buffer);
            file.close();
            json = new String(buffer, "UTF-8");
        } catch (IOException ex) {
            ex.printStackTrace();
            return null;
        }
        return json;
    }

    private void initView() {
        initData();
        mMoreParticipantsLayout = findViewById(R.id.ll_selected_participants_pop_button);
        mMoreParticipantsTitle = findViewById(R.id.tv_participants_title);
        mRvContact = findViewById(R.id.rv_select_participant);
        mImgSelectFinish = findViewById(R.id.img_select_participant_arrows_return);
        mRvSelectedParticipant = findViewById(R.id.rv_participant_avatar);
        mTvParticipantsTitle = findViewById(R.id.rv_select_participant_title);
        mConfirmSelectButton = findViewById(R.id.btn_confirm_participant);
        mEtSearchParticipant = findViewById(R.id.et_search_participant);

        updateSelectParticipantsView(mSelectedList.size());
        mTvParticipantsTitle.setText(mContext.getString(R.string.app_all_participant, mFriendList.size()));

        mRvContact.setLayoutManager(new LinearLayoutManager(mContext));
        mSelectParticipantAdapter = new SelectParticipantAdapter(mContext, mFriendList, mSelectedList, mUnSelectableList);
        mRvContact.setAdapter(mSelectParticipantAdapter);

        mSelectedParticipantsPanelAdapter = new SelectedParticipantsPanelAdapter(mContext);
        mSelectedParticipantsPanelAdapter.setSelectedParticipant(getFilteredSelectedList());
        mRvSelectedParticipant.setAdapter(mSelectedParticipantsPanelAdapter);
        mRvSelectedParticipant.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));

        mMoreParticipantsLayout.setOnClickListener(this::onClick);
        mConfirmSelectButton.setOnClickListener(this::onClick);
        mImgSelectFinish.setOnClickListener(this::onClick);

        mMoreParticipantsPopView = new MoreParticipantsPopView(mContext);
        mMoreParticipantsPopView.setDeleteParticipantCallback(new MoreParticipantsPopView.onParticipantDeletedCallback() {
            @Override
            public void onParticipantDelete(User user) {
                mSelectParticipantAdapter.updateParticipantSelectionStatus(user);
                mSelectedParticipantsPanelAdapter.removeSelectedParticipant(user);
                updateSelectParticipantsView(mSelectedParticipantsPanelAdapter.getSelectedParticipantsSize());
            }
        });

        mSelectParticipantAdapter.setParticipantChangedCallback(new SelectParticipantAdapter.ParticipantChangedCallback() {
            @Override
            public void onSelectParticipantChanged(User participant, boolean isSelect) {
                if (isSelect) {
                    mSelectedParticipantsPanelAdapter.addSelectedParticipant(participant);
                } else {
                    mSelectedParticipantsPanelAdapter.removeSelectedParticipant(participant);
                }
                updateSelectParticipantsView(mSelectedParticipantsPanelAdapter.getSelectedParticipantsSize());
            }
        });

        mEtSearchParticipant.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            @Override
            public void afterTextChanged(Editable s) {
                if (TextUtils.isEmpty(s.toString())) {
                    restoreSelectParticipantList();
                } else {
                    searchParticipantsList(s.toString());
                }
            }
        });

    }

    public void initData() {
        Bundle bundle = this.getIntent().getExtras();
        ConferenceParticipants participants = (ConferenceParticipants) bundle.getSerializable(CONFERENCE_PARTICIPANTS);
        if (participants == null) {
            return;
        }
        mSelectedList = participants.selectedList;
        mUnSelectableList = participants.unSelectableList;
    }

    private ArrayList<User> getFilteredSelectedList() {
        ArrayList<User> filteredList = new ArrayList<>();
        for (User user : mSelectedList) {
            if (!mUnSelectableList.contains(user)) {
                filteredList.add(user);
            }
        }
        return filteredList;
    }

    public void updateSelectParticipantsView(int selectedParticipantsSize) {
        mRvSelectedParticipant.setVisibility(selectedParticipantsSize > MAX_VISIBLE_USER_AVATARS ? View.GONE : View.VISIBLE);
        mMoreParticipantsLayout.setVisibility(selectedParticipantsSize > MAX_VISIBLE_USER_AVATARS ? View.VISIBLE : View.GONE);
        mMoreParticipantsTitle.setText(mContext.getString(R.string.app_selected_participant_size, selectedParticipantsSize));
        mConfirmSelectButton.setText(mContext.getString(R.string.app_confirm_select_participant, selectedParticipantsSize));
    }

    private void searchParticipantsList(String content) {
        if (mFriendList.isEmpty()) {
            return;
        }
        List<User> selectedList = mSelectedParticipantsPanelAdapter.getSelectedParticipant();
        List<SelectedParticipant> searchFriendList = new ArrayList<>();
        for (User user : mFriendList) {
            if (isTargetParticipant(user, content)) {
                SelectedParticipant participant = new SelectedParticipant();
                participant.userInfo = user;
                participant.isSelected = selectedList.contains(user);
                participant.isDisable = mUnSelectableList.contains(user);
                searchFriendList.add(participant);
            }
        }
        mSelectParticipantAdapter.setFriendList(searchFriendList);
    }

    private void restoreSelectParticipantList() {
        List<User> selectedList = mSelectedParticipantsPanelAdapter.getSelectedParticipant();
        List<SelectedParticipant> friendList = new ArrayList<>();
        for (User user : mFriendList) {
            SelectedParticipant participant = new SelectedParticipant();
            participant.userInfo = user;
            participant.isSelected = selectedList.contains(user);
            participant.isDisable = mUnSelectableList.contains(user);
            friendList.add(participant);
        }
        mSelectParticipantAdapter.setFriendList(friendList);
    }

    private boolean isTargetParticipant(User user, String content) {
        if (user.userId.toLowerCase().contains(content.toLowerCase())) {
            return true;
        }
        if (TextUtils.isEmpty(user.userName)) {
            return false;
        }
        return user.userName.toLowerCase().contains(content.toLowerCase());
    }

    private void onClick(View view) {
        if (view.getId() == R.id.ll_selected_participants_pop_button) {
            if (mMoreParticipantsPopView == null) {
                mMoreParticipantsPopView = new MoreParticipantsPopView(mContext);
            }
            mMoreParticipantsPopView.setAttendees(mSelectedParticipantsPanelAdapter.getSelectedParticipant());
            mMoreParticipantsPopView.show();
        } else if (view.getId() == R.id.btn_confirm_participant) {
            returnResultAndFinishActivity();
        } else if (view.getId() == R.id.img_select_participant_arrows_return) {
            setResult(0, null);
            finish();
        }
    }

    public void returnResultAndFinishActivity() {
        List<User> participants = mSelectedParticipantsPanelAdapter.getSelectedParticipant();
        Intent intent = new Intent();
        intent.putExtra(SELECTED_PARTICIPANTS, new ArrayList<>(participants));
        setResult(3, intent);
        finish();
    }

}
