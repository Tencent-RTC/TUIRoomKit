package com.tencent.qcloud.tuikit.tuibeauty.view;

import static com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyConstants.TAB_TYPE_LUT;

import android.content.Context;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuikit.tuibeauty.R;
import com.tencent.qcloud.tuikit.tuibeauty.model.ITUIBeautyService;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyItemInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyService;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyTabInfo;
import com.tencent.qcloud.tuikit.tuibeauty.presenter.ITUIBeautyPresenter;
import com.tencent.qcloud.tuikit.tuibeauty.presenter.TUIBeautyPresenter;
import com.tencent.qcloud.tuikit.tuibeauty.view.adapter.TUIBeautyItemAdapter;
import com.tencent.qcloud.tuikit.tuibeauty.view.adapter.TUIBeautyTabAdapter;
import com.tencent.qcloud.tuikit.tuibeauty.view.internal.TUIBeautyHorizontalScrollView;

/**
 * 美颜面板
 */
public class TUIBeautyView extends BottomSheetDialog {
    private static final String TAG = "TUIBeautyView";

    private Context                       mContext;
    private TUIBeautyHorizontalScrollView mScrollTabView;
    private TUIBeautyHorizontalScrollView mScrollItemView;
    private LinearLayout                  mRelativeSeekBarLayout;
    private SeekBar                       mSeekBarLevel;
    private TextView                      mTextLevelHint;
    private TextView                      mTextLevelValue;

    private TUIBeautyInfo       mTUIBeautyInfo;
    private TUIBeautyTabInfo    mCurrentTabInfo;
    private TUIBeautyItemInfo[] mCurrentItemInfo;
    private int                 mCurrentTabPosition = 0;
    private int[]               mCurrentItemPosition;
    private OnBeautyListener    mOnBeautyListener;
    private ITUIBeautyPresenter mPresenter;
    private TXBeautyManager     mBeautyManager;

    public TUIBeautyView(Context context, TXBeautyManager beautyManager) {
        super(context, R.style.TUIBeautyDialogTheme);
        setContentView(R.layout.tuibeauty_view_panel);
        this.mContext = context;
        mBeautyManager = beautyManager;
        Window window = getWindow();
        if (window != null) {
            window.findViewById(R.id.design_bottom_sheet).setBackgroundResource(android.R.color.transparent);
        }
        initPresenter();
        initView();
    }

    public static ITUIBeautyService getBeautyService() {
        return TUIBeautyService.getInstance();
    }

    @Override
    public void dismiss() {
        super.dismiss();
    }

    private void initPresenter() {
        if (mPresenter == null) {
            mPresenter = new TUIBeautyPresenter(mContext, mBeautyManager);
        }
        mPresenter.clear();
        mTUIBeautyInfo = mPresenter.getDefaultBeauty();
        initData();
        //本地路径
        mPresenter.fillingMaterialPath(mTUIBeautyInfo);
    }

    //初始化美颜面板界面参数
    private void initData() {
        int tabSize = mTUIBeautyInfo.getBeautyTabList().size();
        mCurrentItemPosition = new int[tabSize];
        mCurrentItemInfo = new TUIBeautyItemInfo[tabSize];

        for (int i = 0; i < tabSize; i++) {
            TUIBeautyTabInfo tuiBeautyTabInfo = mTUIBeautyInfo.getBeautyTabList().get(i);
            mCurrentItemPosition[i] = tuiBeautyTabInfo.getTabItemListDefaultSelectedIndex();
            mCurrentItemInfo[i] = tuiBeautyTabInfo.getTabItemList()
                    .get(tuiBeautyTabInfo.getTabItemListDefaultSelectedIndex());
        }
    }

    private void initView() {
        mRelativeSeekBarLayout = (LinearLayout) findViewById(R.id.beauty_rl_seek_bar);
        mSeekBarLevel = (SeekBar) findViewById(R.id.beauty_seek_bar_third);
        mTextLevelHint = (TextView) findViewById(R.id.beauty_tv_seek_bar_hint);
        mTextLevelValue = (TextView) findViewById(R.id.beauty_tv_seek_bar_value);
        mSeekBarLevel.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                mCurrentItemInfo[mCurrentTabPosition].setItemLevel(progress);
                if (mCurrentTabInfo.getTabType() == TAB_TYPE_LUT) {
                    mSeekBarLevel.setMax(100);
                    mTextLevelValue.setText(String.valueOf(progress / 100.0));
                } else {
                    mTextLevelValue.setText(String.valueOf(progress));
                }
                mCurrentItemInfo[mCurrentTabPosition].setProperty(
                        mPresenter.setCurrentDisPlayValue(mCurrentItemInfo[mCurrentTabPosition].getProperty(),
                                progress));
                if (mOnBeautyListener == null || !mOnBeautyListener.onLevelChanged(mCurrentTabInfo, mCurrentTabPosition,
                        mCurrentItemInfo[mCurrentTabPosition], mCurrentItemPosition[mCurrentTabPosition], progress)) {
                    mPresenter.setBeautySpecialEffects(mCurrentTabInfo,
                            mCurrentItemInfo[mCurrentTabPosition], mCurrentItemPosition[mCurrentTabPosition]);
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {

            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {

            }
        });

        mScrollTabView = (TUIBeautyHorizontalScrollView) findViewById(R.id.beauty_horizontal_picker_view_first);
        mScrollItemView = (TUIBeautyHorizontalScrollView) findViewById(R.id.beauty_horizontal_picker_second);

        createTabList();
    }

    //创建美颜面板
    private void createTabList() {
        if (mTUIBeautyInfo == null) {
            mTUIBeautyInfo = mPresenter.getDefaultBeauty();
        }
        TUIBeautyTabAdapter tuiBeautyTabAdapter = new TUIBeautyTabAdapter(mContext, mTUIBeautyInfo);
        mScrollTabView.setAdapter(tuiBeautyTabAdapter);
        tuiBeautyTabAdapter.setOnTabClickListener(new TUIBeautyTabAdapter.OnTabChangeListener() {
            @Override
            public void onTabChange(TUIBeautyTabInfo tuiBeautyTabInfo, int position) {
                mCurrentTabInfo = tuiBeautyTabInfo;
                mCurrentTabPosition = position;
                createItemList(tuiBeautyTabInfo, position);
                if (mOnBeautyListener != null) {
                    mOnBeautyListener.onTabChange(tuiBeautyTabInfo, position);
                }
            }
        });
        TUIBeautyTabInfo tuiBeautyTabInfo = mTUIBeautyInfo.getBeautyTabList().get(0);
        mCurrentTabInfo = tuiBeautyTabInfo;
        mCurrentTabPosition = 0;
        createItemList(tuiBeautyTabInfo, 0);
    }

    //创建每一个类型的Item
    private void createItemList(final TUIBeautyTabInfo tabInfo, final int tabPosition) {
        TUIBeautyItemAdapter tuiBeautyItemAdapter = new TUIBeautyItemAdapter(mContext);
        tuiBeautyItemAdapter.setData(tabInfo, mCurrentItemPosition[tabPosition]);
        mScrollItemView.setAdapter(tuiBeautyItemAdapter);
        mScrollItemView.setClicked(mCurrentItemPosition[tabPosition]);
        tuiBeautyItemAdapter.setOnItemClickListener(new TUIBeautyItemAdapter.OnItemClickListener() {
            @Override
            public void onItemClick(TUIBeautyItemInfo tuiBeautyItemInfo, int position) {
                mCurrentItemPosition[tabPosition] = position;
                mCurrentItemInfo[tabPosition] = tuiBeautyItemInfo;
                createSeekBar(tabInfo, tuiBeautyItemInfo);
                if (mOnBeautyListener == null
                        || !mOnBeautyListener.onClick(tabInfo, tabPosition, tuiBeautyItemInfo, position)) {
                    mPresenter.setBeautySpecialEffects(tabInfo, tuiBeautyItemInfo, position);
                }
            }
        });
        TUIBeautyItemInfo tuiBeautyItemInfo = tabInfo.getTabItemList().get(mCurrentItemPosition[tabPosition]);
        mCurrentItemInfo[tabPosition] = tuiBeautyItemInfo;
        createSeekBar(tabInfo, tuiBeautyItemInfo);
    }

    // 创建强度视图
    private void createSeekBar(TUIBeautyTabInfo tuiBeautyTabInfo, TUIBeautyItemInfo tuiBeautyItemInfo) {
        int visibility;
        if (tuiBeautyItemInfo.getItemLevel() == -1) {
            visibility = View.GONE;
        } else {
            visibility = View.VISIBLE;
            mTextLevelValue.setText(String.valueOf(tuiBeautyItemInfo.getItemDisplayDefaultValue()));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                mSeekBarLevel.setMin(tuiBeautyItemInfo.getItemDisplayMinValue());
            }
            mSeekBarLevel.setMax(tuiBeautyItemInfo.getItemDisplayMaxValue());
            mSeekBarLevel.setProgress(tuiBeautyItemInfo.getItemDisplayDefaultValue());
            TUIBeautyResourceParse.setTextViewSize(mTextLevelHint, tuiBeautyTabInfo.getTabItemLevelHintSize());
            TUIBeautyResourceParse.setTextViewColor(mTextLevelHint, tuiBeautyTabInfo.getTabItemLevelHintColor());
            TUIBeautyResourceParse.setTextViewSize(mTextLevelValue, tuiBeautyTabInfo.getTabItemLevelValueSize());
            TUIBeautyResourceParse.setTextViewColor(mTextLevelValue, tuiBeautyTabInfo.getTabItemLevelValueColor());
        }
        mRelativeSeekBarLayout.setVisibility(visibility);
    }

    /**
     * 美颜特效点击回调
     *
     * @param onBeautyListener
     */
    public void setOnBeautyListener(OnBeautyListener onBeautyListener) {
        mOnBeautyListener = onBeautyListener;
    }

    public abstract static class OnBeautyListener {
        public void onTabChange(TUIBeautyTabInfo tuiBeautyTabInfo, int position) {
        }

        public boolean onClose() {
            return true;
        }

        public boolean onClick(TUIBeautyTabInfo tabInfo, int tabPos, TUIBeautyItemInfo itemInfo, int itemPos) {
            return false;
        }

        public boolean onLevelChanged(TUIBeautyTabInfo tabInfo, int tabPos, TUIBeautyItemInfo itemInfo, int itemPos,
                                      int beautyLevel) {
            return false;
        }
    }
}