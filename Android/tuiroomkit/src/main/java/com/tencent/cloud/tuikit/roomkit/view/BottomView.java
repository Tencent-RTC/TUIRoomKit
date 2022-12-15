package com.tencent.cloud.tuikit.roomkit.view;

import android.content.Context;
import android.graphics.drawable.StateListDrawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

import androidx.appcompat.widget.AppCompatImageButton;

import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.BottomItemData;
import com.tencent.cloud.tuikit.roomkit.model.entity.BottomSelectItemData;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BottomView extends LinearLayout {
    private Context mContext;

    private List<BottomItemData> mDataList;

    private Map<BottomItemData.Type, AppCompatImageButton> buttonMap;

    public BottomView(Context context, List<BottomItemData> dataList) {
        super(context);
        mContext = context;
        mDataList = dataList;
        buttonMap = new HashMap<>();
        initView();
    }

    private void initView() {
        if (mContext == null) {
            return;
        }
        if (mDataList == null) {
            return;
        }
        if (mDataList.isEmpty()) {
            return;
        }
        final List<View> list = new ArrayList<>();
        for (final BottomItemData itemData : mDataList) {
            if (BottomItemData.Type.BARRAGE.equals(itemData.getType())
                    || BottomItemData.Type.BEAUTY.equals(itemData.getType())) {
                RelativeLayout.LayoutParams params = new RelativeLayout
                        .LayoutParams(getResources()
                        .getDimensionPixelSize(R.dimen.tuiroomkit_bottom_item_view_width),
                        getResources().getDimensionPixelSize(R.dimen.tuiroomkit_bottom_item_view_height));
                params.addRule(RelativeLayout.CENTER_IN_PARENT);
                FrameLayout layout = new FrameLayout(getContext());
                layout.addView(itemData.getView(), params);
                list.add(layout);
                addView(layout);
                continue;
            }
            View layout = View.inflate(mContext, R.layout.tuiroomkit_bottom_button, null);
            final AppCompatImageButton button = layout.findViewById(R.id.image_button);
            button.setScaleType(ImageView.ScaleType.FIT_XY);
            StateListDrawable stateListDrawable = createStateListDrawable(itemData);
            button.setBackground(stateListDrawable);
            button.setEnabled(itemData.isEnable());
            final BottomSelectItemData selectItemData = itemData.getSelectItemData();
            if (selectItemData != null) {
                button.setSelected(selectItemData.isSelected());
                button.setOnClickListener(new OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        boolean changed = !selectItemData.isSelected();
                        selectItemData.setSelected(changed);
                        button.setSelected(changed);
                        BottomSelectItemData.OnItemSelectListener listener = selectItemData.getOnItemSelectListener();
                        if (listener != null) {
                            listener.onItemSelected(changed);
                        }
                    }
                });
            } else {
                button.setOnClickListener(new OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        BottomItemData.OnItemClickListener listener = itemData.getOnItemClickListener();
                        if (listener != null) {
                            listener.onItemClick();
                        }
                    }
                });
            }
            list.add(layout);
            addView(layout);
            buttonMap.put(itemData.getType(), button);
        }
        post(new Runnable() {
            @Override
            public void run() {
                updateItemsPosition();
            }
        });
    }

    private void updateItemsPosition() {
        int childCount = getChildCount();
        int parentWidth = ((ViewGroup) getParent()).getWidth();
        for (int i = 0; i < childCount; i++) {
            View childView = getChildAt(i);
            int padding = (parentWidth - (childView.getWidth() * childCount)) / (childCount + 1);
            LinearLayout.LayoutParams params = (LinearLayout.LayoutParams) childView.getLayoutParams();
            params.leftMargin = padding;
            params.width = LayoutParams.WRAP_CONTENT;
            params.height = LayoutParams.WRAP_CONTENT;
            childView.setLayoutParams(params);
        }
    }

    private StateListDrawable createStateListDrawable(BottomItemData itemData) {
        StateListDrawable stateListDrawable = new StateListDrawable();
        int stateEnabled = android.R.attr.state_enabled;
        if (itemData.getDisableIconId() != 0) {
            stateListDrawable.addState(new int[]{-stateEnabled},
                    getResources().getDrawable(itemData.getDisableIconId()));
        }
        final BottomSelectItemData selectItemData = itemData.getSelectItemData();
        if (selectItemData != null) {
            int stateSelected = android.R.attr.state_selected;
            if (selectItemData.getSelectedIconId() != 0) {
                stateListDrawable.addState(new int[]{stateSelected},
                        getResources().getDrawable(selectItemData.getSelectedIconId()));
            }

            if (selectItemData.getUnSelectedIconId() != 0) {
                stateListDrawable.addState(new int[]{-stateSelected},
                        getResources().getDrawable(selectItemData.getUnSelectedIconId()));
            }

        } else {
            stateListDrawable.addState(new int[]{-stateEnabled},
                    getResources().getDrawable(itemData.getIconId()));
        }
        return stateListDrawable;
    }

    private void onButtonDisabled(boolean disable, BottomItemData.Type type) {
        BottomItemData itemData = findItemData(type);
        if (itemData != null) {
            itemData.setEnable(!disable);
            if (disable) {
                BottomSelectItemData bottomSelectItemData = itemData.getSelectItemData();
                if (bottomSelectItemData != null) {
                    bottomSelectItemData.setSelected(false);
                }
            }
        }
        AppCompatImageButton button = buttonMap.get(type);
        if (button != null) {
            button.setEnabled(!disable);
            if (disable) {
                button.setSelected(false);
            }
        }
    }

    public void disableCameraButton(boolean disable) {
        onButtonDisabled(disable, BottomItemData.Type.VIDEO);
    }

    public void disableMicrophoneButton(boolean disable) {
        onButtonDisabled(disable, BottomItemData.Type.AUDIO);
    }

    public void updateButtonSelectStatus(BottomItemData.Type type, boolean isSelected) {
        BottomItemData itemData = findItemData(type);
        if (itemData != null && itemData.getSelectItemData() != null) {
            itemData.getSelectItemData().setSelected(isSelected);
        }
        AppCompatImageButton button = buttonMap.get(type);
        if (button != null) {
            button.setSelected(isSelected);
        }
    }

    private BottomItemData findItemData(BottomItemData.Type type) {
        if (mDataList == null) {
            return null;
        }
        for (BottomItemData bottomItemData : mDataList) {
            if (bottomItemData.getType() == type) {
                return bottomItemData;
            }
        }
        return null;
    }
}
