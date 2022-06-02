package com.tencent.liteav.tuiroom.ui;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.liteav.tuiroom.R;

public class RoomHeadBarView extends RelativeLayout {
    private ImageView       mHeadsetImg;
    private ImageView       mCameraSwitchImg;
    private ImageView       mBtnReport;
    private TextView        mTitleTv;
    private TextView        mExitTv;
    private ImageButton     mCopyRoomIdIb;
    private HeadBarCallback mHeadBarCallback;

    public RoomHeadBarView(Context context) {
        this(context, null);
    }

    public RoomHeadBarView(Context context, AttributeSet attrs) {
        super(context, attrs);
        inflate(context, R.layout.tuiroom_head_bar, this);
        initView(this);
    }

    private void initView(@NonNull final View itemView) {
        mHeadsetImg = (ImageView) itemView.findViewById(R.id.img_headset);
        mCameraSwitchImg = (ImageView) itemView.findViewById(R.id.img_camera_switch);
        mTitleTv = (TextView) itemView.findViewById(R.id.tv_title);
        mExitTv = (TextView) itemView.findViewById(R.id.tv_exit);
        mCopyRoomIdIb = (ImageButton) itemView.findViewById(R.id.copy_room_id);

        mHeadsetImg.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mHeadBarCallback != null) {
                    mHeadBarCallback.onHeadSetClick();
                }
            }
        });

        mCameraSwitchImg.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mHeadBarCallback != null) {
                    mHeadBarCallback.onSwitchCameraClick();
                }
            }
        });

        mBtnReport = (ImageView) itemView.findViewById(R.id.btn_report);
        mBtnReport.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mHeadBarCallback != null) {
                    mHeadBarCallback.onReportBtnClick();
                }
            }
        });

        mExitTv.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mHeadBarCallback != null) {
                    mHeadBarCallback.onExitClick();
                }
            }
        });

        mCopyRoomIdIb.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                copyContentToClipboard(mTitleTv.getText().toString());
            }
        });
    }

    public void showReportView(boolean isShow) {
        mBtnReport.setVisibility(isShow ? VISIBLE : GONE);
    }

    private void copyContentToClipboard(String content) {
        ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData mClipData = ClipData.newPlainText("Label", content);
        cm.setPrimaryClip(mClipData);
        ToastUtils.showShort(R.string.tuiroom_copy_room_id_success);
    }

    public void setTitle(String text) {
        if (mTitleTv != null) {
            mTitleTv.setText(text);
        }
    }

    public void setHeadsetImg(boolean useSpeaker) {
        if (mHeadsetImg != null) {
            mHeadsetImg.setImageResource(useSpeaker ? R.drawable.tuiroom_ic_speaker : R.drawable.tuiroom_ic_headset);
        }
    }

    public void setHeadBarCallback(HeadBarCallback headBarCallback) {
        mHeadBarCallback = headBarCallback;
    }

    public interface HeadBarCallback {
        void onHeadSetClick();

        void onSwitchCameraClick();

        void onExitClick();

        void onReportBtnClick();
    }
}
