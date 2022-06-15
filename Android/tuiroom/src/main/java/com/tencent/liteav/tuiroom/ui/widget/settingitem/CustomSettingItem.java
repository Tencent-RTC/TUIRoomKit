package com.tencent.liteav.tuiroom.ui.widget.settingitem;

import android.content.Context;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.constraintlayout.widget.Guideline;

import com.tencent.liteav.tuiroom.R;
import com.tencent.liteav.tuiroom.model.impl.base.TRTCLogger;

import java.util.List;

public class CustomSettingItem extends BaseSettingItem {
    public static final  int        ALIGN_LEFT   = 1;
    public static final  int        ALIGN_RIGHT  = 2;
    public static final  int        ALIGN_CENTER = 3;
    private static final String     TAG          = CustomSettingItem.class.getName();
    private final        List<View> mViewList;

    private ItemViewHolder mItemViewHolder;

    public CustomSettingItem(Context context,
                             @NonNull ItemText itemText,
                             List<View> viewList) {
        super(context, itemText);
        mViewList = viewList;
        mItemViewHolder = new ItemViewHolder(
                mInflater.inflate(R.layout.tuiroom_item_setting_custom, null)
        );
    }

    public void setAlign(int align) {
        mItemViewHolder.setAlign(align);
    }

    @Override
    public View getView() {
        if (mItemViewHolder != null) {
            return mItemViewHolder.rootView;
        }
        return null;
    }

    public class ItemViewHolder {
        public  View         rootView;
        public  TextView     mTitle;
        public  LinearLayout mItemLl;
        private Guideline    mLGl;
        private Guideline    mRGl;
        private Guideline    mEndGl;

        public ItemViewHolder(@NonNull final View itemView) {
            rootView = itemView;
            mTitle = (TextView) itemView.findViewById(R.id.title);
            mItemLl = (LinearLayout) itemView.findViewById(R.id.ll_item);
            mLGl = (Guideline) itemView.findViewById(R.id.gl_l);
            mRGl = (Guideline) itemView.findViewById(R.id.gl_r);
            mEndGl = (Guideline) itemView.findViewById(R.id.gl_end);

            if (mItemText == null) {
                TRTCLogger.e(TAG, "item text get null here");
                return;
            }

            mTitle.setText(mItemText.title);
            for (View view : mViewList) {
                mItemLl.addView(view);
            }
        }

        public void setAlign(int align) {
            ConstraintLayout.LayoutParams layoutParams = new ConstraintLayout.LayoutParams(mItemLl.getLayoutParams());
            if (align == ALIGN_CENTER) {
                layoutParams.startToStart = R.id.gl_l;
                layoutParams.endToEnd = R.id.gl_end;
            } else if (align == ALIGN_RIGHT) {
                layoutParams.startToStart = R.id.gl_r;
                layoutParams.endToEnd = R.id.gl_end;
            } else if (align == ALIGN_LEFT) {
                layoutParams.startToStart = R.id.gl_l;
                layoutParams.endToEnd = R.id.gl_r;
            }
            layoutParams.topToTop = ConstraintLayout.LayoutParams.PARENT_ID;
            layoutParams.bottomToBottom = ConstraintLayout.LayoutParams.PARENT_ID;
            mItemLl.setLayoutParams(layoutParams);
        }
    }
}
