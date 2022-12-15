package com.tencent.cloud.tuikit.roomkit.model.entity;

import android.view.View;

import androidx.annotation.DrawableRes;

public class BottomItemData {
    private boolean enable;

    @DrawableRes
    private int iconId;

    @DrawableRes
    private int disableIconId;

    private BottomSelectItemData selectItemData;

    private Type type;

    private View view;

    private OnItemClickListener onItemClickListener;

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public void setView(View view) {
        this.view = view;
    }

    public View getView() {
        return view;
    }

    public OnItemClickListener getOnItemClickListener() {
        return onItemClickListener;
    }

    public void setOnItemClickListener(OnItemClickListener listener) {
        this.onItemClickListener = listener;
    }


    public boolean isEnable() {
        return enable;
    }

    public void setEnable(boolean enable) {
        this.enable = enable;
    }

    public int getIconId() {
        return iconId;
    }

    public void setIconId(int iconId) {
        this.iconId = iconId;
    }

    public int getDisableIconId() {
        return disableIconId;
    }

    public void setDisableIconId(int disableIconId) {
        this.disableIconId = disableIconId;
    }

    public BottomSelectItemData getSelectItemData() {
        return selectItemData;
    }

    public void setSelectItemData(BottomSelectItemData selectItemData) {
        this.selectItemData = selectItemData;
    }

    public interface OnItemClickListener {
        void onItemClick();
    }

    public enum Type {
        AUDIO,
        VIDEO,
        BEAUTY,
        BARRAGE,
        MEMBER_LIST,
        EXTENSION
    }
}
