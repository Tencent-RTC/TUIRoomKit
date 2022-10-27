package com.tencent.qcloud.tuikit.tuibeauty.view.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import com.tencent.qcloud.tuikit.tuibeauty.R;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyItemInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyTabInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyResourceUtils;

import java.util.ArrayList;
import java.util.List;

public class TUIBeautyItemAdapter extends BaseAdapter {

    private Context                 mContext;
    private TUIBeautyTabInfo        mTUIBeautyTabInfo;
    private List<TUIBeautyItemInfo> mTUIBeautyItemInfoList;
    private OnItemClickListener     mItemClickListener;
    private int                     mSelectPos;    // 当前选中


    public interface OnItemClickListener {
        void onItemClick(TUIBeautyItemInfo tuiBeautyItemInfo, int position);
    }

    public TUIBeautyItemAdapter(Context context) {
        mContext = context;
    }

    public void setData(TUIBeautyTabInfo tuiBeautyTabInfo) {
        setData(tuiBeautyTabInfo, 0);
    }

    public void setData(TUIBeautyTabInfo tuiBeautyTabInfo, int defaultIndex) {
        mTUIBeautyTabInfo = tuiBeautyTabInfo;
        mSelectPos = defaultIndex;
        if (mTUIBeautyItemInfoList == null) {
            mTUIBeautyItemInfoList = new ArrayList<>();
        }
        mTUIBeautyItemInfoList.clear();
        mTUIBeautyItemInfoList.addAll(tuiBeautyTabInfo.getTabItemList());
        notifyDataSetChanged();
    }

    @Override
    public int getCount() {
        return mTUIBeautyTabInfo.getTabItemList().size();
    }

    @Override
    public TUIBeautyItemInfo getItem(int position) {
        return mTUIBeautyItemInfoList.get(position);
    }

    @Override
    public long getItemId(int position) {
        return mTUIBeautyItemInfoList.get(position).getItemId();
    }

    @Override
    public View getView(final int position, View convertView, ViewGroup parent) {
        final ViewHolder holder;
        if (convertView == null) {
            convertView = LayoutInflater.from(mContext).inflate(R.layout.tuibeauty_view_item, parent, false);
            holder = new ViewHolder(convertView);
            LinearLayout.LayoutParams layoutParams = (LinearLayout.LayoutParams) holder.icon.getLayoutParams();
            int width;
            if (mTUIBeautyTabInfo.getTabItemIconWidth() == LinearLayout.LayoutParams.MATCH_PARENT) {
                width = LinearLayout.LayoutParams.MATCH_PARENT;
            } else if (mTUIBeautyTabInfo.getTabItemIconWidth() == LinearLayout.LayoutParams.WRAP_CONTENT) {
                width = LinearLayout.LayoutParams.WRAP_CONTENT;
            } else {
                width = TUIBeautyResourceParse.dip2px(mContext, mTUIBeautyTabInfo.getTabItemIconWidth());
            }
            int height;
            if (mTUIBeautyTabInfo.getTabItemIconHeight() == LinearLayout.LayoutParams.MATCH_PARENT) {
                height = LinearLayout.LayoutParams.MATCH_PARENT;
            } else if (mTUIBeautyTabInfo.getTabItemIconHeight() == LinearLayout.LayoutParams.WRAP_CONTENT) {
                height = LinearLayout.LayoutParams.WRAP_CONTENT;
            } else {
                height = TUIBeautyResourceParse.dip2px(mContext, mTUIBeautyTabInfo.getTabItemIconHeight());
            }
            layoutParams.width = width;
            layoutParams.height = height;
            holder.icon.setLayoutParams(layoutParams);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }
        final TUIBeautyItemInfo TUIBeautyItemInfo = getItem(position);
        TUIBeautyResourceParse.setTextViewText(holder.title,
                TUIBeautyResourceUtils.getString(TUIBeautyItemInfo.getItemName()));
        TUIBeautyResourceParse.setTextViewSize(holder.title, mTUIBeautyTabInfo.getTabItemNameSize());
        if (mSelectPos == position) {
            TUIBeautyResourceParse.setTextViewColor(holder.title, mTUIBeautyTabInfo.getTabItemNameColorSelect());
            TUIBeautyResourceParse.setImageResource(holder.icon, TUIBeautyItemInfo.getItemIconSelect());
        } else {
            TUIBeautyResourceParse.setTextViewColor(holder.title, mTUIBeautyTabInfo.getTabItemNameColorNormal());
            TUIBeautyResourceParse.setImageResource(holder.icon, TUIBeautyItemInfo.getItemIconNormal());
        }
        convertView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (mItemClickListener != null) {
                    TUIBeautyItemInfo.setItemCategory(mTUIBeautyTabInfo.getTabType());
                    mItemClickListener.onItemClick(TUIBeautyItemInfo, position);
                    if (mSelectPos != position) {
                        mSelectPos = position;
                        notifyDataSetChanged();
                    }
                }
            }
        });
        return convertView;
    }

    public void setOnItemClickListener(OnItemClickListener itemClickListener) {
        mItemClickListener = itemClickListener;
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        private ImageView icon;
        private TextView  title;

        public ViewHolder(View itemView) {
            super(itemView);
            icon = (ImageView) itemView.findViewById(R.id.beauty_iv_icon);
            title = (TextView) itemView.findViewById(R.id.beauty_tv_title);
        }
    }
}
