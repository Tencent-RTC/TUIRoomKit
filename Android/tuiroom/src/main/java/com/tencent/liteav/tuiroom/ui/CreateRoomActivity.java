package com.tencent.liteav.tuiroom.ui;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.liteav.basic.IntentUtils;
import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.TUIRoom;
import com.tencent.liteav.tuiroom.model.TUIRoomCoreDef;
import com.tencent.liteav.tuiroom.ui.utils.StateBarUtils;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.BaseSettingItem;
import com.tencent.liteav.tuiroom.ui.widget.settingitem.SwitchSettingItem;
import com.tencent.qcloud.tuicore.TUILogin;

import java.util.ArrayList;

public class CreateRoomActivity extends AppCompatActivity {
    private Toolbar                      mToolbar;
    private TextView                     mRoomIdTv;
    private TextView                     mCreateTv;
    private ImageButton                  mCopyRoomId;
    private TextView                     mUserNameTv;
    private LinearLayout                 mSettingContainerLl;
    private ArrayList<SwitchSettingItem> mSettingItemList;

    private boolean mOpenCamera;
    private boolean mOpenAudio;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroom_activity_create_room);
        StateBarUtils.setLightStatusBar(this);
        initView();
        initData();
    }

    private void initData() {
        String userId = TUILogin.getUserId();
        String userName = TUILogin.getNickName();
        if (!TextUtils.isEmpty(userId)) {
            String roomId = String.valueOf(getRoomId(userId));
            mRoomIdTv.setText(roomId);
        }
        if (!TextUtils.isEmpty(userName)) {
            mUserNameTv.setText(userName);
        }
    }

    private void enterRoom() {
        int roomId = getRoomId(TUILogin.getUserId());
        TUIRoom tuiRoom = TUIRoom.sharedInstance(this);
        tuiRoom.createRoom(roomId, TUIRoomCoreDef.SpeechMode.FREE_SPEECH, mOpenCamera, mOpenAudio);
    }

    private void initView() {
        mToolbar = (Toolbar) findViewById(R.id.toolbar);
        mCreateTv = (TextView) findViewById(R.id.tv_create);
        mUserNameTv = (TextView) findViewById(R.id.tv_user_name);
        mRoomIdTv = findViewById(R.id.tv_room_id);
        mCopyRoomId = findViewById(R.id.copy_room_id);
        mSettingContainerLl = (LinearLayout) findViewById(R.id.ll_setting_container);

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
                IntentUtils.safeStartActivity(CreateRoomActivity.this, intent);
            }
        });

        mToolbar.setNavigationOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        mCreateTv.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                enterRoom();
            }
        });
        mCopyRoomId.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                copyContentToClipboard(mRoomIdTv.getText().toString());
            }
        });
    }

    private void copyContentToClipboard(String content) {
        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData mClipData = ClipData.newPlainText("Label", content);
        cm.setPrimaryClip(mClipData);
        ToastUtils.showShort(R.string.tuiroom_copy_room_id_success);
    }

    private int getRoomId(String userId) {
        // Here, a simple `userId` hashcode is used. Get the remainder of the `userId` hashcode, and the unique value
        // generated on the backend will be your room ID.
        return (userId + "_voice_room").hashCode() & 0x3B9AC9FF;
    }
}
