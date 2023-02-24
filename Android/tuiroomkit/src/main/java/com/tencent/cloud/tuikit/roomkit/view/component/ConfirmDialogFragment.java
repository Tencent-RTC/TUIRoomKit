package com.tencent.cloud.tuikit.roomkit.view.component;

import android.app.Dialog;
import android.app.DialogFragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.tencent.cloud.tuikit.roomkit.R;

public class ConfirmDialogFragment extends DialogFragment {
    private static final String TAG = "ConfirmDialogFragment";

    private View                  mDivideLine;
    private String                mMessageText;
    private String                mPositiveText;
    private String                mNegativeText;
    private PositiveClickListener mPositiveClickListener;
    private NegativeClickListener mNegativeClickListener;

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final Dialog dialog = new Dialog(getActivity(), R.style.TUIRoomDialogTheme);
        dialog.setContentView(R.layout.tuiroomkit_dialog_confirm);
        dialog.setCancelable(false);
        mDivideLine = dialog.findViewById(R.id.divide_line);
        initTextMessage(dialog);
        initButtonPositive(dialog);
        initButtonNegative(dialog);
        return dialog;
    }

    @Override
    public void show(FragmentManager manager, String tag) {
        try {
            FragmentTransaction ft = manager.beginTransaction();
            ft.add(this, tag);
            ft.commitAllowingStateLoss();
        } catch (IllegalStateException e) {
            Log.e(TAG, "IllegalStateException:" + e);
        }
    }

    private void initTextMessage(Dialog dialog) {
        TextView textMessage = dialog.findViewById(R.id.tv_message);
        textMessage.setText(mMessageText);
    }

    private void initButtonPositive(Dialog dialog) {
        Button buttonPositive = dialog.findViewById(R.id.btn_positive);

        if (mPositiveClickListener == null) {
            buttonPositive.setVisibility(View.GONE);
            return;
        }
        if (!TextUtils.isEmpty(mPositiveText)) {
            buttonPositive.setText(mPositiveText);
        }
        buttonPositive.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mPositiveClickListener.onClick();
            }
        });
    }

    private void initButtonNegative(Dialog dialog) {
        Button buttonNegative = dialog.findViewById(R.id.btn_negative);

        if (mNegativeClickListener == null) {
            buttonNegative.setVisibility(View.GONE);
            mDivideLine.setVisibility(View.GONE);
            return;
        }
        if (!TextUtils.isEmpty(mNegativeText)) {
            buttonNegative.setText(mNegativeText);
        }
        buttonNegative.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mNegativeClickListener.onClick();
            }
        });
    }

    public void setMessage(String message) {
        mMessageText = message;
    }

    public void setPositiveText(String text) {
        mPositiveText = text;
    }

    public void setNegativeText(String text) {
        mNegativeText = text;
    }

    public void setPositiveClickListener(PositiveClickListener listener) {
        this.mPositiveClickListener = listener;
    }

    public void setNegativeClickListener(NegativeClickListener listener) {
        this.mNegativeClickListener = listener;
    }

    //TODO 需要改为EventCent通知的方式
    public interface PositiveClickListener {
        void onClick();
    }

    public interface NegativeClickListener {
        void onClick();
    }
}