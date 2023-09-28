package com.tencent.liteav.demo.view.component;

import android.content.Context;
import android.view.View;
import android.widget.Button;
import android.widget.RadioGroup;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.R;

public class RoomTypeSelectView extends BottomSheetDialog implements View.OnClickListener {
    private boolean    mIsFreeSpeech;
    private Button     mButtonConfirm;
    private Button     mButtonCancel;
    private RadioGroup mGroupRoomType;

    private SpeechModeCallback mSpeechModeCallback;

    public interface SpeechModeCallback {
        void onSpeechModeChanged(TUIRoomDefine.SpeechMode speechMode);
    }

    public RoomTypeSelectView(@NonNull Context context) {
        super(context, R.style.TUIRoomDialogFragmentTheme);
        setContentView(R.layout.tuiroomkit_view_room_type_select);
        initView();
    }

    public void setSpeechModeCallback(SpeechModeCallback speechModeCallback) {
        mSpeechModeCallback = speechModeCallback;
    }

    private void initView() {
        mButtonCancel = findViewById(R.id.btn_cancel);
        mButtonConfirm = findViewById(R.id.btn_confirm);
        mGroupRoomType = findViewById(R.id.rg_room_type);

        mButtonCancel.setOnClickListener(this);
        mButtonConfirm.setOnClickListener(this);

        mGroupRoomType.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                mIsFreeSpeech = checkedId == R.id.rb_free_speech;
            }
        });
    }

    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.btn_cancel) {
            dismiss();
        } else if (v.getId() == R.id.btn_confirm) {
            if (mSpeechModeCallback != null) {
                mSpeechModeCallback.onSpeechModeChanged(mIsFreeSpeech ? TUIRoomDefine.SpeechMode.FREE_TO_SPEAK :
                        TUIRoomDefine.SpeechMode.SPEAK_AFTER_TAKING_SEAT);
            }
            dismiss();
        }
    }
}
