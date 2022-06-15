//
//  TUIBeautyService.h
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import <Foundation/Foundation.h>
#import "TUIBeautyView.h"

NS_ASSUME_NONNULL_BEGIN
@class TXBeautyManager, XMagic;
@class TUIBeautyBaseItem;

@interface TUIBeautyService: NSObject<TUIBeautyService>

@property (nonatomic, weak) TXBeautyManager *beautyManager;

@property (nonatomic, readonly) XMagic *xMagicKit;

+ (instancetype)sharedInstance;

/// 设置美颜参数
- (void)configPropertyWith:(TUIBeautyBaseItem *)beautyBaseItem;
/// 美颜强度改变
- (void)sliderValueChange:(TUIBeautyBaseItem *)beautyBaseItem;
/// 清理美颜资源
- (void)cleanXMagic;

@end

NS_ASSUME_NONNULL_END
