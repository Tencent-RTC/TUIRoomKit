//
//  TUIBeautyView.h
//  TUIBeauty
//
//  Created by gg on 2021/9/22.
//

#import <UIKit/UIKit.h>
#import "TUIThemeConfig.h"

NS_ASSUME_NONNULL_BEGIN
@protocol TUIBeautyService <NSObject>

/// 设置美颜授权License
///
/// @note vist: https://cloud.tencent.com/document/product/616/65878
///
/// @param url NSString XMagicSDK License url
/// @param key NSString XMagicSDK License key
/// @param completion License 授权回调
///
- (void)setLicenseUrl:(NSString *)url
                  key:(NSString *)key
           completion:(void (^)(NSInteger authResult, NSString *errorMsg))completion;

/// TUIBeauty 美颜纹理帧处理
///
/// @param textureId int 待处理的GL纹理ID
/// @param textureWidth int 纹理宽
/// @param textureHeight int 纹理高
/// @return textureId int 处理后的GL纹理ID
///
- (int)processVideoFrameWithTextureId:(int)textureId
                         textureWidth:(int)textureWidth
                        textureHeight:(int)textureHeight;

@end


@class TXBeautyManager;
@interface TUIBeautyView : UIView

@property (nonatomic, strong, null_resettable) TUIThemeConfig *theme;

/// 初始化时需要传入 BeautyManager 对象
///
/// @param beautyManager 通过 SDK 对象 -getBeautyManager 方法获取
///
- (instancetype)initWithBeautyManager:(TXBeautyManager *)beautyManager;

/// 获取TUIBeautyService 视频帧处理服务
+ (id<TUIBeautyService>)getBeautyService;

/// 弹出美颜面板
- (void)show;
/// 关闭美颜面板
- (void)dismiss;

@end

NS_ASSUME_NONNULL_END
