package com.tencent.qcloud.tuikit.tuibeauty.view.adapter;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyTabInfo;

public class TUIBeautyTabAdapter extends BaseAdapter implements View.OnClickListener {

    private Context             mContext;
    private TUIBeautyInfo       mTUIBeautyInfo;
    private TextView            mTextSelected;
    private OnTabChangeListener mTabClickListener;

    public interface OnTabChangeListener {
        void onTabChange(TUIBeautyTabInfo tuiBeautyTabInfo, int position);
    }

    public TUIBeautyTabAdapter(Context context, TUIBeautyInfo tuiBeautyInfo) {
        mContext = context;
        mTUIBeautyInfo = tuiBeautyInfo;
    }

    @Override
    public int getCount() {
        return mTUIBeautyInfo.getBeautyTabList().size();
    }

    @Override
    public TUIBeautyTabInfo getItem(int position) {
        return mTUIBeautyInfo.getBeautyTabList().get(position);
    }

    @Override
    public long getItemId(int position) {
        return mTUIBeautyInfo.getBeautyTabList().get(position).getTabId();
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        TextView tabView;
        if (convertView == null) {
            tabView = new TextView(mContext);
            TUIBeautyResourceParse.setTextViewColor(tabView, mTUIBeautyInfo.getBeautyTabNameColorNormal());
            TUIBeautyResourceParse.setTextViewSize(tabView, mTUIBeautyInfo.getBeautyTabNameSize());
            TUIBeautyResourceParse.setTextViewSize(tabView, 14);
            ViewGroup.LayoutParams layoutParams = new ViewGroup.LayoutParams(mTUIBeautyInfo.getBeautyTabNameWidth(),
                    mTUIBeautyInfo.getBeautyTabNameHeight());
            tabView.setLayoutParams(layoutParams);
        } else {
            tabView = (TextView) convertView;
        }
        if (position == 0) {
            tabView.setPadding(TUIBeautyResourceParse.dip2px(mContext, 20), 0,
                    TUIBeautyResourceParse.dip2px(mContext, 11),
                    TUIBeautyResourceParse.dip2px(mContext, 30));
        } else {
            tabView.setPadding(TUIBeautyResourceParse.dip2px(mContext, 12), 0,
                    TUIBeautyResourceParse.dip2px(mContext, 11),
                    TUIBeautyResourceParse.dip2px(mContext, 30));
        }
        TUIBeautyResourceParse.setTextViewText(tabView, getItem(position).getTabName());
        tabView.setTag(position);
        tabView.setOnClickListener(this);
        if (position == 0) {
            setCurrentPosition(0, tabView);
        }
        return tabView;
    }

    @Override
    public void onClick(View view) {
        int index = (int) view.getTag();
        setCurrentPosition(index, view);
    }

    private void setCurrentPosition(int position, View view) {
        if (mTextSelected != null) {
            TUIBeautyResourceParse.setTextViewColor(mTextSelected, mTUIBeautyInfo.getBeautyTabNameColorNormal());
        }
        mTextSelected = (TextView) view;
        TUIBeautyResourceParse.setTextViewColor(mTextSelected, mTUIBeautyInfo.getBeautyTabNameColorSelect());
        if (mTabClickListener != null) {
            mTabClickListener.onTabChange(getItem(position), position);
        }
    }

    public void setOnTabClickListener(OnTabChangeListener tabClickListener) {
        mTabClickListener = tabClickListener;
    }
}
