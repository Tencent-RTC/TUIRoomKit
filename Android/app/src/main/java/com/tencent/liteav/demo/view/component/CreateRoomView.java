package com.tencent.liteav.demo.view.component;

import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.appcompat.widget.Toolbar;

import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.view.settingitem.SwitchSettingItem;
import com.tencent.liteav.demo.R;
import com.tencent.liteav.demo.viewmodel.CreateRoomViewModel;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;

import java.util.ArrayList;
import java.util.HashMap;

public class CreateRoomView extends RelativeLayout
        implements View.OnClickListener {
    private Context             mContext;
    private Toolbar             mToolbar;
    private TextView            mTextRoomId;
    private TextView            mTextCreateRoom;
    
    private TextView            mTextUserName;
    private TextView            mTextRoomType;
    private LinearLayout        mLayoutSettingContainer;
    private RoomTypeSelectView  mRoomTypeDialog;
    private CreateRoomViewModel mViewModel;

    private TUICallback mFinishCallback;

    public CreateRoomView(Context context) {
        super(context);
        View.inflate(context, R.layout.tuiroomkit_view_create_room, this);
        mContext = context;
        mViewModel = new CreateRoomViewModel(mContext);
        initView();
        initData();
    }

    public void setFinishCallback(TUICallback finishCallback) {
        mFinishCallback = finishCallback;
    }

    private void initData() {
        String userId = TUILogin.getUserId();
        String userName = TUILogin.getNickName();
        String roomId = mViewModel.getRoomId(userId);
        mTextRoomId.setText(roomId);
        mTextUserName.setText(userName);
    }


    private void initView() {
        mToolbar = findViewById(R.id.toolbar);
        mTextCreateRoom = findViewById(R.id.tv_create);
        mTextUserName = findViewById(R.id.tv_user_name);
        mTextRoomId = findViewById(R.id.tv_room_id);
        mTextRoomType = findViewById(R.id.tv_room_type);
        mLayoutSettingContainer = findViewById(R.id.ll_setting_container);
        mRoomTypeDialog = new RoomTypeSelectView(mContext);
        mRoomTypeDialog.setSpeechModeCallback(new RoomTypeSelectView.SpeechModeCallback() {
            @Override
            public void onSpeechModeChanged(TUIRoomDefine.SpeechMode speechMode) {
                mViewModel.setSpeechMode(speechMode);
                int resId = TUIRoomDefine.SpeechMode.FREE_TO_SPEAK.equals(speechMode)
                        ? R.string.tuiroomkit_room_free_speech
                        : R.string.tuiroomkit_room_raise_hand;
                mTextRoomType.setText(resId);
            }
        });

        mTextRoomType.setOnClickListener(this);
        mTextCreateRoom.setOnClickListener(this);
        mToolbar.setNavigationOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mFinishCallback != null) {
                    mFinishCallback.onSuccess();
                }
            }
        });

        ArrayList<SwitchSettingItem> settingItemList = mViewModel.createSwitchSettingItemList();
        int size = settingItemList.size();
        for (int i = 0; i < size; i++) {
            SwitchSettingItem item = settingItemList.get(i);
            if (i == size - 1) {
                item.hideBottomLine();
            }
            mLayoutSettingContainer.addView(item.getView());
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
    }

    @Override
    public void onClick(View view) {
        if (view.getId() == R.id.tv_room_type) {
            if (mRoomTypeDialog == null) {
                mRoomTypeDialog = new RoomTypeSelectView(mContext);
            }
            mRoomTypeDialog.show();
        } else if (view.getId() == R.id.tv_create) {
            mViewModel.createRoom(mTextRoomId.getText().toString());
            mTextCreateRoom.setClickable(false);
        }
    }
}
