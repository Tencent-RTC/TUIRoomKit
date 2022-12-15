package com.tencent.liteav.demo;

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
import com.tencent.liteav.basic.UserModelManager;
import com.tencent.liteav.demo.utils.StateBarUtils;
import com.tencent.liteav.demo.widget.settingitem.BaseSettingItem;
import com.tencent.liteav.demo.widget.settingitem.SwitchSettingItem;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.TUIRoomKit;

import java.util.ArrayList;

public class JoinRoomActivity extends AppCompatActivity {
    private Toolbar                      mToolbar;
    private TextView                     mEnterTv;
    private TextView                     mUserNameTv;
    private EditText                     mRoomIdEt;
    private LinearLayout                 mSettingContainerLl;
    private ArrayList<SwitchSettingItem> mSettingItemList;

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
        setContentView(R.layout.app_activity_join_room);
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
        String userName = UserModelManager.getInstance().getUserModel().userName;
        if (!TextUtils.isEmpty(userName)) {
            mUserNameTv.setText(userName);
        }
    }

    private void enterMeeting(String roomId) {
        if (TextUtils.isEmpty(roomId)) {
            return;
        }
        RoomInfo roomInfo = new RoomInfo();
        roomInfo.roomId = roomId;
        roomInfo.isOpenCamera = mOpenCamera;
        roomInfo.isOpenMicrophone = mOpenAudio;
        TUIRoomKit tuiRoomKit = TUIRoomKit.sharedInstance(this);
        tuiRoomKit.enterRoom(roomInfo, TUIRoomKit.RoomScene.MEETING);
    }

    private void initView() {
        mToolbar = findViewById(R.id.toolbar);
        mRoomIdEt = findViewById(R.id.et_room_id);
        mEnterTv = findViewById(R.id.tv_enter);
        mSettingContainerLl = findViewById(R.id.ll_setting_container);
        mUserNameTv = findViewById(R.id.tv_user_name);

        mSettingItemList = new ArrayList<>();
        BaseSettingItem.ItemText itemText =
                new BaseSettingItem.ItemText(getString(R.string.app_title_turn_on_camera), "");
        SwitchSettingItem mOpenCameraItem = new SwitchSettingItem(this, itemText,
                new SwitchSettingItem.Listener() {
                    @Override
                    public void onSwitchChecked(boolean isChecked) {
                        mOpenCamera = isChecked;
                    }
                }).setCheck(true);
        mSettingItemList.add(mOpenCameraItem);

        itemText = new BaseSettingItem.ItemText(getString(R.string.app_title_turn_on_microphone), "");
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
