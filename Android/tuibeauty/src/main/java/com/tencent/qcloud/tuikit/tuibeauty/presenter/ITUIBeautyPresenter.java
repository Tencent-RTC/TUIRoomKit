package com.tencent.qcloud.tuikit.tuibeauty.presenter;

import androidx.annotation.IntRange;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyItemInfo;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyTabInfo;
import com.tencent.xmagic.XmagicProperty;

public interface ITUIBeautyPresenter {

    /**
     * 设置美颜效果
     *
     * @param tabInfo      tab信息,包括:美颜,滤镜,动效,美妆,手势,AI抠背,绿幕等
     * @param itemInfo     每个分类里面的不同type,比如,美颜包括:光滑,自然,美白,红润等等
     * @param itemPosition item位置
     */
    void setBeautySpecialEffects(TUIBeautyTabInfo tabInfo, TUIBeautyItemInfo itemInfo,
                                 @IntRange(from = 0) int itemPosition);

    /**
     * 设置美颜类型
     *
     * @param style 美颜风格
     * @param level 强度等级
     */
    void setBeautyStyleAndLevel(int style, int level);

    /**
     * 美颜数据本地存储
     *
     * @param beautyInfo
     */
    void fillingMaterialPath(TUIBeautyInfo beautyInfo);

    /**
     * 清空美颜选项
     */
    void clear();

    /**
     * 获取美颜数据
     */
    TUIBeautyInfo getDefaultBeauty();

    /**
     * 更新property当前effValue
     *
     * @param property 要更新的property
     * @param value    更新后的effValue
     * @return 更新后的property
     */
    XmagicProperty<XmagicProperty.XmagicPropertyValues> setCurrentDisPlayValue(
            XmagicProperty<XmagicProperty.XmagicPropertyValues> property, int value);
}
