package com.tencent.liteav.tuiroom.ui.widget.base;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.tencent.liteav.tuiroom.model.TUIRoomCore;

/**
 * 设置fragment的基类
 */
public abstract class BaseSettingFragment extends Fragment {
    protected TUIRoomCore mTUIRoomCore;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, Bundle savedInstanceState) {
        return inflater.inflate(getLayoutId(), container, false);
    }

    public void setTRTCRoomCore(TUIRoomCore roomCore) {
        mTUIRoomCore = roomCore;
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        initView(view);
    }

    protected abstract void initView(View view);

    protected abstract int getLayoutId();
}
