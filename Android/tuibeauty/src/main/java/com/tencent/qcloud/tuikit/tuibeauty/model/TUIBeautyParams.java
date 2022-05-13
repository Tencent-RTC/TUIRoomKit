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
    public int    mBigEyeLevel;               // 大眼
    public int    mFaceSlimLevel;             // 瘦脸
    public int    mNoseSlimLevel;             // 瘦鼻
    public int    mChinSlimLevel;             // 缩下巴
    public int    mFaceVLevel;                // V脸
    public int    mFaceShortLevel;            // 短脸
    public int    mEyeLightenLevel       = 0; // 亮眼
    public int    mToothWhitenLevel      = 0; // 白牙
    public int    mWrinkleRemoveLevel    = 0; // 祛皱
    public int    mPounchRemoveLevel     = 0; // 祛眼袋
    public int    mSmileLinesRemoveLevel = 0; // 祛法令纹
    public int    mForeheadLevel         = 0; // 发际线
    public int    mEyeDistanceLevel      = 0; // 眼距
    public int    mEyeAngleLevel         = 0; // 眼角
    public int    mMouthShapeLevel       = 0; // 嘴型
    public int    mNoseWingLevel         = 0; // 鼻翼
    public int    mNosePositionLevel     = 0; // 鼻子位置
    public int    mLipsThicknessLevel    = 0; // 嘴唇厚度
    public int    mFaceBeautyLevel       = 0; // 脸型
    public String mMotionTmplPath;            // 动效文件路径
    public String mGreenFile;                 // 绿幕
}
