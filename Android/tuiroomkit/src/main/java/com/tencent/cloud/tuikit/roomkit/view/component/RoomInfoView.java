package com.tencent.cloud.tuikit.roomkit.view.component;

import android.content.Context;
import android.view.View;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.cloud.tuikit.roomkit.viewmodel.RoomInfoViewModel;

public class RoomInfoView extends BottomSheetDialog {
    private TextView          mTextName;
    private TextView          mTextMaster;
    private TextView          mTextRoomId;
    private TextView          mTextRoomType;
    private TextView          mTextRoomLink;
    private ImageButton       mButtonCopyRoomId;
    private ImageButton       mButtonCopyRoomLink;
    private ImageButton       mButtonQRCode;
    private RoomInfoViewModel mViewModel;

    public RoomInfoView(@NonNull Context context) {
        super(context, R.style.TUIRoomDialogFragmentTheme);
        setContentView(R.layout.tuiroomkit_dialog_meeting_info);
        mViewModel = new RoomInfoViewModel(context, this);
        initView();
    }

    private void initView() {
        mTextName = findViewById(R.id.tv_info_name);
        mTextMaster = findViewById(R.id.tv_master);
        mTextRoomId = findViewById(R.id.tv_room_id);
        mTextRoomType = findViewById(R.id.tv_type);
        mTextRoomLink = findViewById(R.id.tv_room_link);
        mButtonCopyRoomId = findViewById(R.id.btn_copy_room_id);
        mButtonCopyRoomLink = findViewById(R.id.btn_copy_room_link);
        mButtonQRCode = findViewById(R.id.btn_qr_code);

        RoomInfo roomInfo = mViewModel.getRoomInfo();
        mTextName.setText(roomInfo.name);
        mViewModel.setMasterName();
        mTextRoomType.setText(mViewModel.getRoomType());
        mTextRoomId.setText(roomInfo.roomId);
        mTextRoomLink.setText(mViewModel.getRoomURL());

        mButtonCopyRoomId.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mViewModel.copyContentToClipboard(mTextRoomId.getText().toString(),
                        getContext().getString(R.string.tuiroomkit_copy_room_id_success));
            }
        });

        mButtonQRCode.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mViewModel.showQRCodeView();
                dismiss();
            }
        });

        mButtonCopyRoomLink.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mViewModel.copyContentToClipboard(mTextRoomLink.getText().toString(),
                        getContext().getString(R.string.tuiroomkit_copy_room_line_success));
            }
        });
    }

    public void setMasterName(String name) {
        mTextMaster.setText(name);
    }
}
