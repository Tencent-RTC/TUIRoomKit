package com.tencent.liteav.meeting.ui.widget.settingitem;

import android.content.Context;
import android.support.annotation.NonNull;
import android.text.TextUtils;
import android.view.View;
import android.widget.TextView;

import com.tencent.liteav.demo.trtc.R;
import com.tencent.rtmp.TXLog;

import java.util.List;

/**
 * 带selection的item
 *
 * @author guanyifeng
 */
public class SelectionSettingItem extends BaseSettingItem {
    private static final String TAG = SelectionSettingItem.class.getName();

    private final Listener       mListener;
    private       ItemViewHolder mItemViewHolder;

    public SelectionSettingItem(Context context,
                                @NonNull ItemText itemText,
                                Listener listener) {
        super(context, itemText);
        mItemViewHolder = new ItemViewHolder(
                mInflater.inflate(R.layout.trtcmeeting_item_setting_selection, null)
        );
        mListener = listener;
    }

    public SelectionSettingItem setSelect(final int index) {
        if (mItemViewHolder == null) {
            return this;
        }
        setSelectText(index);
        if (mItemViewHolder.mDialog == null) {
            return this;
        }
        mItemViewHolder.mDialog.setSelection(index);
        return this;
    }

    private void setSelectText(int index) {
        if (mItemViewHolder.mSelectText == null) {
            return;
        }
        if (mItemText != null) {
            List<String> contentText = mItemText.contentText;
            if (contentText != null && !contentText.isEmpty()) {
                String text = contentText.get(index);
                if (!TextUtils.isEmpty(text)) {
                    mItemViewHolder.mSelectText.setText(text);
                }
            }
        }

    }

    @Override
    public View getView() {
        if (mItemViewHolder != null) {
            return mItemViewHolder.rootView;
        }
        return null;
    }

    public int getSelected() {
        return mItemViewHolder.mDialog.getSelectedItemPosition();
    }

    public interface Listener {
        void onItemSelected(int position, String text);
    }

    public class ItemViewHolder {
        public  View                    rootView;
        private TextView                mTitle;
        private TextView                mSelectText;
        private SingleRadioButtonDialog mDialog;

        public ItemViewHolder(@NonNull final View itemView) {
            rootView = itemView;
            mTitle = (TextView) itemView.findViewById(R.id.title);
            mSelectText = (TextView) itemView.findViewById(R.id.select_text);
            if (mItemText == null) {
                TXLog.e(TAG, "item text get null here");
                return;
            }
            mTitle.setText(mItemText.title);
            mDialog = new SingleRadioButtonDialog(mContext, mItemText.contentText);
            mDialog.setSelectListener(new SingleRadioButtonDialog.OnSelectListener() {
                @Override
                public void onSelect(int position, String text) {
                    if (mListener != null) {
                        mListener.onItemSelected(position, text);
                    }
                    mSelectText.setText(text);
                }
            });
            mDialog.setTitle(mItemText.title);
            rootView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (mDialog.isShowing()) {
                        mDialog.dismiss();
                    }
                    mDialog.show();
                }
            });
        }
    }
}
