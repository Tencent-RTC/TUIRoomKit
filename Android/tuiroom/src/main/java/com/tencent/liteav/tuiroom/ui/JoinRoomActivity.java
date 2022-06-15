package com.tencent.liteav.tuiroom.ui;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.tencent.liteav.basic.IntentUtils;
import com.tencent.liteav.tuiroom.TUIRoom;
import com.tencent.liteav.tuiroom.ui.utils.StateBarUtils;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.BaseSettingItem;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.SwitchSettingItem;
import com.tencent.liteav.tuiroom.R;
import com.tencent.qcloud.tuicore.TUILogin;

import java.util.ArrayList;

public class JoinRoomActivity extends AppCompatActivity {
    private Toolbar                      mToolbar;
    private EditText                     mRoomIdEt;
    private TextView                     mEnterTv;
    private LinearLayout                 mSettingContainerLl;
    private ArrayList<SwitchSettingItem> mSettingItemList;
    private TextView                     mUserNameTv;

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
        setContentView(R.layout.tuiroom_activity_join_room);
        StateBarUtils.setLightStatusBar(this);
        initView();
        initData();
    }

    private void initData() {
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
                String roomId = mRoomIdEt.getText().toString();
                enterMeeting(roomId);
            }
        });
        String userName = TUILogin.getNickName();
        if (!TextUtils.isEmpty(userName)) {
            mUserNameTv.setText(userName);
        }
    }

    private void enterMeeting(String roomId) {
        TUIRoom tuiRoom = TUIRoom.sharedInstance(this);
        tuiRoom.enterRoom(Integer.parseInt(roomId), mOpenCamera, mOpenAudio);
    }

    private void initView() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mRoomIdEt = (EditText) findViewById(R.id.et_room_id);
        mEnterTv = (TextView) findViewById(R.id.tv_enter);
        mSettingContainerLl = (LinearLayout) findViewById(R.id.ll_setting_container);
        mUserNameTv = (TextView) findViewById(R.id.tv_user_name);

        mSettingItemList = new ArrayList<>();
        BaseSettingItem.ItemText itemText =
                new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_turn_on_camera), "");
        SwitchSettingItem mOpenCameraItem = new SwitchSettingItem(this, itemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mOpenCamera = isChecked;
                    }
                }).setCheck(true);
        mSettingItemList.add(mOpenCameraItem);

        itemText = new BaseSettingItem.ItemText(getString(R.string.tuiroom_title_turn_on_microphone), "");
        SwitchSettingItem mOpenAudioItem = new SwitchSettingItem(this, itemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mOpenAudio = isChecked;
                    }
                }).setCheck(true);
        mSettingItemList.add(mOpenAudioItem);

        int size = mSettingItemList.size();
        for (int i = 0; i < size; i++) {
            SwitchSettingItem item = mSettingItemList.get(i);
            if (i == size - 1) {
                item.hideBottomLine();
            }
            mSettingContainerLl.addView(item.getView());
        }
        findViewById(R.id.btn_tuiroom_link).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setData(Uri.parse("https://cloud.tencent.com/document/product/647/45667"));
                IntentUtils.safeStartActivity(JoinRoomActivity.this, intent);
            }
        });
    }
}
