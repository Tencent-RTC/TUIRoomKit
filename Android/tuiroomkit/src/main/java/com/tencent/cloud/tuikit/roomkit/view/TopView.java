package com.tencent.cloud.tuikit.roomkit.view;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.tencent.cloud.tuikit.roomkit.R;

public class TopView extends FrameLayout {
    private ImageView           mHeadsetImg;
    private ImageView           mCameraSwitchImg;
    private ImageView           mBtnReport;
    private TextView            mTitleTv;
    private TextView            mExitTv;
    private ImageButton         mCopyRoomIdIb;
    private OnItemClickListener mOnItemClickListener;
    private boolean             mIsUseSpeaker;

    public TopView(Context context) {
        super(context);
        inflate(context, R.layout.tuiroomkit_view_top, this);
        initView(this);
    }

    private void initView(final View itemView) {
        mHeadsetImg = itemView.findViewById(R.id.img_headset);
        mCameraSwitchImg = itemView.findViewById(R.id.img_camera_switch);
        mTitleTv = itemView.findViewById(R.id.tv_title);
        mExitTv = itemView.findViewById(R.id.tv_exit);
        mCopyRoomIdIb = itemView.findViewById(R.id.copy_room_id);

        mHeadsetImg.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                mIsUseSpeaker = !mIsUseSpeaker;
                setHeadsetImg(mIsUseSpeaker);
                if (mOnItemClickListener != null) {
                    mOnItemClickListener.onHeadSetClick(mIsUseSpeaker);
                }
            }
        });

        mCameraSwitchImg.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mOnItemClickListener != null) {
                    mOnItemClickListener.onSwitchCameraClick();
                }
            }
        });

        mBtnReport = itemView.findViewById(R.id.btn_report);
        mBtnReport.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mOnItemClickListener != null) {
                    mOnItemClickListener.onReportClick();
                }
            }
        });

        mExitTv.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mOnItemClickListener != null) {
                    mOnItemClickListener.onExitRoomClick();
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

    private void showReportView(boolean isShow) {
        mBtnReport.setVisibility(isShow ? VISIBLE : GONE);
    }

    private void copyContentToClipboard(String content) {
        ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        ClipData mClipData = ClipData.newPlainText("Label", content);
        cm.setPrimaryClip(mClipData);
        Toast.makeText(getContext(), R.string.tuiroomkit_copy_room_id_success, Toast.LENGTH_SHORT).show();
    }

    public void setTitle(String text) {
        if (mTitleTv != null) {
            mTitleTv.setText(text);
        }
    }

    public void setHeadsetImg(boolean isUseSpeaker) {
        mIsUseSpeaker = isUseSpeaker;
        if (mHeadsetImg != null) {
            mHeadsetImg.setImageResource(isUseSpeaker ? R.drawable.tuiroomkit_ic_speaker :
                    R.drawable.tuiroomkit_ic_headset);
        }
    }

    public void setOnItemClickListener(OnItemClickListener listener) {
        mOnItemClickListener = listener;
    }

    public interface OnItemClickListener {
        void onHeadSetClick(boolean isUseSpeaker);

        void onSwitchCameraClick();

        void onExitRoomClick();

        void onReportClick();
    }
}
