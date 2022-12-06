package com.tencent.qcloud.tuikit.tuibeauty.presenter;


import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.text.TextUtils;
import android.util.Log;
import android.util.TypedValue;
import android.widget.Toast;

import androidx.annotation.IntRange;

import com.tencent.liteav.beauty.TXBeautyManager;
import com.tencent.qcloud.tuikit.tuibeauty.R;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyConstants;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyItemInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyParams;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyService;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyTabInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.download.TUIBeautyDownloadListener;
import com.tencent.qcloud.tuikit.tuibeauty.model.download.TUIBeautyMaterialDownloader;
import com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyResourceUtils;
import com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautySPUtils;
import com.tencent.qcloud.tuikit.tuibeauty.view.internal.TUIBeautyProgressDialog;
import com.tencent.xmagic.XmagicProperty;

import java.io.File;
import java.util.List;

public class TUIBeautyPresenter implements ITUIBeautyPresenter {
    private static final String TAG = "TUIBeautyPresenter";

    private static final int DEFAULT_BEAUTY_LEVEL = 6;
    private static final int BEAUTY_STYLE_SMOOTH  = 0;
    private static final int BEAUTY_STYLE_NATURE  = 1;
    private static final int BEAUTY_STYLE_PITU    = 2;

    private Context         mContext;
    private TUIBeautyParams mTUIBeautyParams;
    private TXBeautyManager mBeautyManager;


    public TUIBeautyPresenter(Context context, TXBeautyManager beautyManager) {
        mContext = context;
        mTUIBeautyParams = new TUIBeautyParams();
        mBeautyManager = beautyManager;
    }

    @Override
    public void setBeautySpecialEffects(TUIBeautyTabInfo tabInfo,
                                        TUIBeautyItemInfo itemInfo, @IntRange(from = 0) int itemPosition) {
        dispatchEffects(tabInfo, itemInfo, itemPosition);
    }

    @Override
    public void setBeautyStyleAndLevel(int style, int level) {
        if (mBeautyManager != null) {
            setBeautyStyle(style);
            setBeautyLevel(level);
        }
    }

    /**
     * 设置指定素材滤镜特效
     *
     * @param filterImage 指定素材，即颜色查找表图片。必须使用 png 格式
     * @param index
     */
    private void setFilter(Bitmap filterImage, int index) {
        mTUIBeautyParams.mFilterBmp = filterImage;
        mTUIBeautyParams.mFilterIndex = index;
        if (mBeautyManager != null) {
            mBeautyManager.setFilter(filterImage);
        }
    }

    /**
     * 设置滤镜浓度
     *
     * @param strength 从0到1，越大滤镜效果越明显，默认值为0.5
     */
    private void setFilterStrength(float strength) {
        mTUIBeautyParams.mFilterMixLevel = strength / 10;
        if (mBeautyManager != null) {
            mBeautyManager.setFilterStrength(mTUIBeautyParams.mFilterMixLevel);
        }
    }

    /**
     * 设置美颜类型
     *
     * @param beautyStyle 美颜风格.三种美颜风格：0 ：光滑 1：自然 2：朦胧
     */
    private void setBeautyStyle(int beautyStyle) {
        if (beautyStyle >= 3 || beautyStyle < 0) {
            return;
        }
        mTUIBeautyParams.mBeautyStyle = beautyStyle;
        if (mBeautyManager != null) {
            mBeautyManager.setBeautyStyle(beautyStyle);
        }
    }

    /**
     * 设置美颜级别
     *
     * @param beautyLevel 美颜级别，取值范围0 - 9； 0表示关闭，1 - 9值越大，效果越明显
     */
    private void setBeautyLevel(int beautyLevel) {
        mTUIBeautyParams.mBeautyLevel = beautyLevel;
        if (mBeautyManager != null) {
            mBeautyManager.setBeautyLevel(beautyLevel);
        }
    }

    /**
     * 设置美白级别
     *
     * @param whitenessLevel 美白级别，取值范围0 - 9； 0表示关闭，1 - 9值越大，效果越明显
     */
    private void setWhitenessLevel(int whitenessLevel) {
        mTUIBeautyParams.mWhiteLevel = whitenessLevel;
        if (mBeautyManager != null) {
            mBeautyManager.setWhitenessLevel(whitenessLevel);
        }
    }

    /**
     * 设置红润级别
     *
     * @param ruddyLevel 红润级别，取值范围0 - 9； 0表示关闭，1 - 9值越大，效果越明显
     */
    private void setRuddyLevel(int ruddyLevel) {
        mTUIBeautyParams.mRuddyLevel = ruddyLevel;
        if (mBeautyManager != null) {
            mBeautyManager.setRuddyLevel(ruddyLevel);
        }
    }

    @Override
    public void fillingMaterialPath(TUIBeautyInfo beautyInfo) {
        for (TUIBeautyTabInfo tabInfo : beautyInfo.getBeautyTabList()) {
            List<TUIBeautyItemInfo> tabItemList = tabInfo.getTabItemList();
            for (TUIBeautyItemInfo itemInfo : tabItemList) {
                String materialValue = TUIBeautySPUtils.get().getString(getMaterialPathKey(itemInfo));
                if (TextUtils.isEmpty(materialValue)) {
                    continue;
                }
                String materialPath = materialValue + File.separator + itemInfo.getProperty().id;
                XmagicProperty<XmagicProperty.XmagicPropertyValues> property =
                        new XmagicProperty<>(XmagicProperty.Category.MOTION, itemInfo.getProperty().id, materialPath,
                                null, null);
                itemInfo.setProperty(property);
            }
        }
    }


    @Override
    public XmagicProperty<XmagicProperty.XmagicPropertyValues> setCurrentDisPlayValue(
            XmagicProperty<XmagicProperty.XmagicPropertyValues> property, int value) {
        return TUIBeautyService.getInstance().setCurrentDisPlayValue(property, value);
    }

    /**
     * 清空美颜配置，如果SDK是新创建的则不需要最后清理，如果SDK是单例，需要调用此方法清空上次设置的美颜参数<br/>
     * 示例：TXUGCRecord是单例，需要调用，TXLivePusher每次创建新的，不需要调用
     */
    @Override
    public void clear() {
        mTUIBeautyParams = new TUIBeautyParams();
        if (mBeautyManager != null) {
            mBeautyManager.setFilter(mTUIBeautyParams.mFilterBmp);
            mBeautyManager.setFilterStrength(mTUIBeautyParams.mFilterMixLevel);
            mBeautyManager.setBeautyStyle(mTUIBeautyParams.mBeautyStyle);
            mBeautyManager.setBeautyLevel(mTUIBeautyParams.mBeautyLevel);
            mBeautyManager.setWhitenessLevel(mTUIBeautyParams.mWhiteLevel);
            mBeautyManager.setRuddyLevel(mTUIBeautyParams.mRuddyLevel);
        }
    }

    @Override
    public TUIBeautyInfo getDefaultBeauty() {
        setBeautyStyleAndLevel(BEAUTY_STYLE_SMOOTH, DEFAULT_BEAUTY_LEVEL);
        setBeautyStyleAndLevel(BEAUTY_STYLE_NATURE, DEFAULT_BEAUTY_LEVEL);
        setBeautyStyleAndLevel(BEAUTY_STYLE_PITU, DEFAULT_BEAUTY_LEVEL);
        setWhitenessLevel(DEFAULT_BEAUTY_LEVEL);
        return TUIBeautyResourceParse.getDefaultBeautyInfo();
    }

    private void dispatchEffects(TUIBeautyTabInfo tabInfo, TUIBeautyItemInfo itemInfo,
                                 @IntRange(from = 0) int itemPosition) {
        int tabType = tabInfo.getTabType();
        switch (tabType) {
            case TUIBeautyConstants.TAB_TYPE_BEAUTY:
                dispatchBeautyEffects(itemInfo);
                break;
            case TUIBeautyConstants.TAB_TYPE_LUT:
                dispatchFilterEffects(itemInfo, itemPosition);
                break;
            case TUIBeautyConstants.TAB_TYPE_MOTION:
            case TUIBeautyConstants.TAB_TYPE_MAKEUP:
            case TUIBeautyConstants.TAB_TYPE_SEGMENTATION:
                downloadVideoMaterial(itemInfo);
                break;
            default:
                break;
        }
    }

    private void downloadVideoMaterial(final TUIBeautyItemInfo itemInfo) {
        if (itemInfo == null) {
            return;
        }
        if ("ID_NONE".equals(itemInfo.getItemXmagicId())) {
            TUIBeautyService.getInstance().updateProperty(itemInfo);
            return;
        }
        if (TextUtils.isEmpty(itemInfo.getMaterialUrl())) {
            return;
        }
        if (!TextUtils.isEmpty(itemInfo.getProperty().resPath)) {
            TUIBeautyService.getInstance().updateProperty(itemInfo);
            return;
        }
        TUIBeautyMaterialDownloader materialDownloader = new TUIBeautyMaterialDownloader(mContext,
                itemInfo.getProperty().id, itemInfo.getMaterialUrl());
        materialDownloader.start(new TUIBeautyDownloadListener() {

            private TUIBeautyProgressDialog mProgressDialog;

            @Override
            public void onDownloadFail(final String errorMsg) {
                ((Activity) mContext).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mProgressDialog != null) {
                            mProgressDialog.dismiss();
                        }
                        Toast.makeText(mContext, errorMsg, Toast.LENGTH_SHORT).show();
                    }
                });
            }

            @Override
            public void onDownloadProgress(final int progress) {
                ((Activity) mContext).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mProgressDialog == null) {
                            mProgressDialog = new TUIBeautyProgressDialog();
                            mProgressDialog.createLoadingDialog(mContext);
                            mProgressDialog.setCancelable(false);               // 设置是否可以通过点击Back键取消
                            mProgressDialog.setCanceledOnTouchOutside(false);   // 设置在点击Dialog外是否取消Dialog进度条
                            mProgressDialog.show();
                        }
                        mProgressDialog.setMsg(progress + "%");
                    }
                });
            }

            @Override
            public void onDownloadSuccess(final String filePath) {
                ((Activity) mContext).runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        if (mProgressDialog != null) {
                            mProgressDialog.dismiss();
                            mProgressDialog = null;
                        }
                        TUIBeautySPUtils.get().put(getMaterialPathKey(itemInfo), filePath);
                        createItemInfo(itemInfo.getProperty().id, filePath, itemInfo);
                        TUIBeautyService.getInstance().updateProperty(itemInfo);
                    }
                });
            }
        }, false, true);
    }

    private void createItemInfo(String id, String resPath, TUIBeautyItemInfo info) {
        if (id == null || resPath == null || info == null) {
            return;
        }
        XmagicProperty.Category category = null;
        if (info.getItemCategory() == TUIBeautyConstants.TAB_TYPE_MOTION
                || info.getItemCategory() == TUIBeautyConstants.TAB_TYPE_SEGMENTATION) {
            category = XmagicProperty.Category.MOTION;
        }
        if (info.getItemCategory() == TUIBeautyConstants.TAB_TYPE_MAKEUP) {
            category = XmagicProperty.Category.MAKEUP;
        }
        String materialPath = resPath + File.separator + id;
        XmagicProperty<XmagicProperty.XmagicPropertyValues> property = new XmagicProperty<>(category, id, materialPath,
                info.getProperty().effKey, info.getProperty().effValue);
        info.setItemLevel(-1);
        info.setProperty(property);
    }

    private void dispatchBeautyEffects(TUIBeautyItemInfo itemInfo) {
        int itemType = itemInfo.getItemType();
        int level = itemInfo.getItemLevel();
        switch (itemType) {
            case TUIBeautyConstants.ITEM_TYPE_BEAUTY_SMOOTH:           // 光滑
                setBeautyStyleAndLevel(BEAUTY_STYLE_SMOOTH, level);
                break;
            case TUIBeautyConstants.ITEM_TYPE_BEAUTY_NATURAL:          // 自然
                setBeautyStyleAndLevel(BEAUTY_STYLE_NATURE, level);
                break;
            case TUIBeautyConstants.ITEM_TYPE_BEAUTY_PITU:             // 天天p图
                setBeautyStyleAndLevel(BEAUTY_STYLE_PITU, level);
                break;
            case TUIBeautyConstants.ITEM_TYPE_BEAUTY_WHITE:            // 美白
                setWhitenessLevel(level);
                break;
            case TUIBeautyConstants.ITEM_TYPE_BEAUTY_RUDDY:            // 红润
                setRuddyLevel(level);
                break;
            default:
                TUIBeautyService.getInstance().updateProperty(itemInfo);
        }
    }

    private void dispatchFilterEffects(TUIBeautyItemInfo itemInfo, int position) {
        Bitmap bitmap = decodeFilterResource(itemInfo);
        mTUIBeautyParams.mFilterBmp = bitmap;
        mTUIBeautyParams.mFilterIndex = position;
        setFilter(bitmap, position);
        setFilterStrength(itemInfo.getItemLevel() / 10.0f);
    }

    private Bitmap decodeFilterResource(TUIBeautyItemInfo itemInfo) {
        int itemType = itemInfo.getItemType();
        int resId = 0;
        switch (itemType) {
            case TUIBeautyConstants.ITEM_TYPE_FILTER_FACE_SHAPE:
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_STANDARD:
                resId = R.drawable.tuibeauty_filter_biaozhun;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_ZIRAN:
                resId = R.drawable.tuibeauty_filter_ziran;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_BAIXI:
                resId = R.drawable.tuibeauty_filter_baixi;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_CHEERY:
                resId = R.drawable.tuibeauty_filter_yinghong;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_CLOUD:
                resId = R.drawable.tuibeauty_filter_yunshang;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_PURE:
                resId = R.drawable.tuibeauty_filter_chunzhen;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_ORCHID:
                resId = R.drawable.tuibeauty_filter_bailan;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_VITALITY:
                resId = R.drawable.tuibeauty_filter_yuanqi;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_SUPER:
                resId = R.drawable.tuibeauty_filter_chaotuo;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_FRAGRANCE:
                resId = R.drawable.tuibeauty_filter_xiangfen;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_WHITE:
                resId = R.drawable.tuibeauty_filter_white;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_ROMANTIC:
                resId = R.drawable.tuibeauty_filter_langman;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_FRESH:
                resId = R.drawable.tuibeauty_filter_qingxin;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_BEAUTIFUL:
                resId = R.drawable.tuibeauty_filter_weimei;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_PINK:
                resId = R.drawable.tuibeauty_filter_fennen;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_REMINISCENCE:
                resId = R.drawable.tuibeauty_filter_huaijiu;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_BLUES:
                resId = R.drawable.tuibeauty_filter_landiao;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_COOL:
                resId = R.drawable.tuibeauty_filter_qingliang;
                break;
            case TUIBeautyConstants.ITEM_TYPE_FILTER_JAPANESE:
                resId = R.drawable.tuibeauty_filter_rixi;
                break;
            default:
                break;
        }
        if (resId != 0) {
            return decodeResource(resId);
        } else {
            return null;
        }
    }

    private Bitmap decodeResource(int id) {
        TypedValue value = new TypedValue();
        TUIBeautyResourceUtils.getResources().openRawResource(id, value);
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inTargetDensity = value.density;
        return BitmapFactory.decodeResource(TUIBeautyResourceUtils.getResources(), id, opts);
    }

    private String getMaterialPathKey(TUIBeautyItemInfo itemInfo) {
        return itemInfo.getItemName() + "-" + itemInfo.getItemType();
    }
}
