package com.tencent.qcloud.tuikit.tuibeauty.model;

import android.graphics.Bitmap;

/**
 * 美颜强度参数
 */
public class TUIBeautyParams {
    public int    mBeautyStyle           = 0; // 美颜类型
    public int    mBeautyLevel           = 4; // 美颜
    public int    mWhiteLevel            = 1; // 美白
    public int    mRuddyLevel            = 0; // 红润
    public Bitmap mFilterBmp;                 // 滤镜LUT图
    public int    mFilterIndex;               // 滑动滤镜索引
    public float  mFilterMixLevel        = 0; // 滤镜程度
}
