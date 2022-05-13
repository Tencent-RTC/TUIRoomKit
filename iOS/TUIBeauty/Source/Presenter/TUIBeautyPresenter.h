//
//  TUIBeautyPresenter.h
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class TUIBeautyBaseItem, TUIBeautyBasePackage;
@class TXBeautyManager, TUIBeautyService;
@interface TUIBeautyPresenter : NSObject

@property (nonatomic, readonly) TUIBeautyService *beautyService;

@property (nonatomic,  weak ) TUIBeautyBaseItem *currentSelectItem;
@property (nonatomic, strong) NSIndexPath *currentShowIndexPath;
@property (nonatomic, strong) NSMutableArray <TUIBeautyBasePackage *>*dataSource;
@property (nonatomic, assign) int beautyStyle;
@property (nonatomic, assign) float beautyLevel;
@property (nonatomic, assign) float whiteLevel;
@property (nonatomic, assign) float ruddyLevel;

- (instancetype)initWithBeautyManager:(TXBeautyManager *)beautyManager;

- (void)applyDefaultSetting;

- (void)cleanXMagic;

@end

NS_ASSUME_NONNULL_END
