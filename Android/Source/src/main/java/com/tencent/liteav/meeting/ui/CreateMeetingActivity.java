package com.tencent.liteav.meeting.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.blankj.utilcode.util.SizeUtils;
import com.tencent.liteav.basic.UserModel;
import com.tencent.liteav.basic.UserModelManager;
import com.tencent.liteav.demo.trtc.R;
import com.tencent.liteav.meeting.ui.utils.StateBarUtils;
import com.tencent.liteav.meeting.ui.widget.settingitem.BaseSettingItem;
import com.tencent.liteav.meeting.ui.widget.settingitem.SwitchSettingItem;

import java.util.ArrayList;

import static com.tencent.trtc.TRTCCloudDef.TRTC_AUDIO_QUALITY_SPEECH;

/**
 * 创建会议页面
 *
 * @author guanyifeng
 */
public class CreateMeetingActivity extends AppCompatActivity {
    public static final int VIDEO_QUALITY_HD    = 1;
    public static final int VIDEO_QUALITY_FAST = 0;

    private TextView mTitleMain;
    private Toolbar                    mToolbar;
    private EditText                   mRoomIdEt;
    private TextView                   mEnterTv;
    private LinearLayout               mSettingContainerLl;
    private ArrayList<BaseSettingItem> mSettingItemList;

    private boolean mOpenCamera;
    private boolean mOpenAudio;

    private TextWatcher mEditTextWatcher = new TextWatcher() {
        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {

        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            if (!TextUtils.isEmpty(mRoomIdEt.getText().toString())) {
                mEnterTv.setEnabled(true);
            } else {
                mEnterTv.setEnabled(false);
            }
        }

        @Override
        public void afterTextChanged(Editable s) {

        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.trtcmeeting_activity_create_meeting);
        StateBarUtils.setLightStatusBar(this);
        initView();
        initData();
    }

    private void initData() {
        String name = getIntent().getStringExtra("TITLE");
        mTitleMain.setText(name);
        mToolbar.setNavigationOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        mRoomIdEt.addTextChangedListener(mEditTextWatcher);
        mEnterTv.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                enterMeeting(mRoomIdEt.getText().toString());
            }
        });
    }

    private void enterMeeting(final String roomId) {
        UserModel userModel  = UserModelManager.getInstance().getUserModel();
        String    userId     = userModel.userId;
        String    userAvatar = userModel.userAvatar;
        String     userName  = userModel.userName;
        int       tempRoomId;
        try {
            tempRoomId = Integer.parseInt(roomId);
        } catch (Exception e) {
            tempRoomId = 10000;
        }
        MeetingMainActivity.enterRoom(this, tempRoomId, userId, userName, userAvatar, mOpenCamera, mOpenAudio, TRTC_AUDIO_QUALITY_SPEECH, VIDEO_QUALITY_HD);
    }

    private void initView() {
        mTitleMain = (TextView) findViewById(R.id.main_title);
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mRoomIdEt = (EditText) findViewById(R.id.et_room_id);
        mEnterTv = (TextView) findViewById(R.id.tv_enter);
        mSettingContainerLl = (LinearLayout) findViewById(R.id.ll_setting_container);

        mSettingItemList = new ArrayList<>();
        BaseSettingItem.ItemText itemText = new BaseSettingItem.ItemText(getString(R.string.trtcmeeting_title_turn_on_camera), "");
        SwitchSettingItem mOpenCameraItem = new SwitchSettingItem(this, itemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mOpenCamera = isChecked;
                    }
                }).setCheck(true);
        mSettingItemList.add(mOpenCameraItem);

        itemText = new BaseSettingItem.ItemText(getString(R.string.trtcmeeting_title_turn_on_microphone), "");
        SwitchSettingItem mOpenAudioItem = new SwitchSettingItem(this, itemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mOpenAudio = isChecked;
                    }
                }).setCheck(true);
        mSettingItemList.add(mOpenAudioItem);

        for (BaseSettingItem item : mSettingItemList) {
            View view = item.getView();
            view.setPadding(0, SizeUtils.dp2px(20), 0, 0);
            mSettingContainerLl.addView(view);
        }

        findViewById(R.id.btn_trtcmeeting_link).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse("https://cloud.tencent.com/document/product/647/45667"));
                startActivity(intent);
            }
        });
    }
}
