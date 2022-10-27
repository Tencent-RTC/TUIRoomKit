package com.tencent.liteav.basic.widget;

import android.app.Dialog;
import android.app.DialogFragment;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.tencent.liteav.trtc.basic.R;

public class BaseDialogFragment extends DialogFragment {
    private static final String MESSAGE_KEY = "MESSAGE_KEY";

    private PositiveClickListener mPositiveClickListener;
    private NegativeClickListener mNegativeClickListener;

    private Button mButtonNegative;
    private Button mButtonPositive;

    private String mBtnPositiveText;
    private String mBtnNegativeText;

    /**
     * DialogFragment 有自己的生命周期管理，不能使用全局变量持有，否则会造成内存泄漏。
     *
     * @param message
     * @return
     */
    public static BaseDialogFragment newInstance(String message) {
        BaseDialogFragment dialogFragment = new BaseDialogFragment();
        Bundle args = new Bundle();
        args.putString(MESSAGE_KEY, message);
        dialogFragment.setArguments(args);
        return dialogFragment;
    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final Dialog dialog = new Dialog(getActivity(), R.style.BasicDialogFragment);
        dialog.setContentView(R.layout.basic_dialog_fragment_layout);
        dialog.setCancelable(false);

        String message = getArguments().getString(MESSAGE_KEY);
        initTextMessage(dialog, message);
        initButtonPositive(dialog);
        initButtonNegative(dialog);
        return dialog;
    }

    public void setPositiveClickListener(PositiveClickListener positiveClickListener) {
        mPositiveClickListener = positiveClickListener;
    }

    public void setNegativeClickListener(NegativeClickListener negativeClickListener) {
        mNegativeClickListener = negativeClickListener;
        if (mButtonNegative != null) {
            mButtonNegative.setVisibility(negativeClickListener == null ? View.GONE : View.VISIBLE);
        }
    }

    public void setPositiveText(String text) {
        if (TextUtils.isEmpty(text)) {
            return;
        }
        mBtnPositiveText = text;
        if (mButtonPositive != null) {
            mButtonPositive.setText(text);
        }
    }

    public void setNegativeText(String text) {
        if (TextUtils.isEmpty(text)) {
            return;
        }
        mBtnNegativeText = text;
        if (mButtonNegative != null) {
            mButtonNegative.setText(text);
        }
    }

    private void initTextMessage(Dialog dialog, String message) {
        TextView messageView = dialog.findViewById(R.id.tv_message);
        messageView.setText(message);
    }

    private void initButtonPositive(Dialog dialog) {
        mButtonPositive = dialog.findViewById(R.id.btn_positive);
        mButtonPositive.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mPositiveClickListener != null) {
                    mPositiveClickListener.onClick();
                }
                BaseDialogFragment.this.dismiss();
            }
        });
        if (!TextUtils.isEmpty(mBtnPositiveText)) {
            mButtonPositive.setText(mBtnPositiveText);
        }
    }

    private void initButtonNegative(Dialog dialog) {
        mButtonNegative = dialog.findViewById(R.id.btn_negative);
        mButtonNegative.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mNegativeClickListener != null) {
                    mNegativeClickListener.onClick();
                }
                BaseDialogFragment.this.dismiss();
            }
        });
        if (!TextUtils.isEmpty(mBtnNegativeText)) {
            mButtonNegative.setText(mBtnNegativeText);
        }
        if (mNegativeClickListener == null) {
            mButtonNegative.setVisibility(View.GONE);
        }
    }

    public interface PositiveClickListener {
        void onClick();
    }

    public interface NegativeClickListener {
        void onClick();
    }
}

