package com.tencent.liteav.tuiroom.ui.widget.base;

import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.tencent.liteav.tuiroom.R;

public abstract class BaseSettingFragmentDialog extends BottomSheetDialogFragment {
    public static final String DATA = "data";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setStyle(DialogFragment.STYLE_NO_TITLE, R.style.TUIRoomBaseFragmentDialogTheme);
    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(getLayoutId(), container, false);
    }

    protected abstract int getLayoutId();

    protected int getWidth(DisplayMetrics dm) {
        return (int) (dm.widthPixels * 0.9);
    }

    protected int getHeight(DisplayMetrics dm) {
        return (int) (dm.heightPixels * 0.8);
    }

    protected boolean isShowBottom() {
        return true;
    }
}
