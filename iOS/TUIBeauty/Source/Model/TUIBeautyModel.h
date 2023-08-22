//
//  TUIBeautyModel.h
//  TUIBeauty
//
//  Created by gg on 2021/9/22.
//

#import <Foundation/Foundation.h>
#import "TUIBeautyPanelActionPerformer.h"

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, TUIBeautyType) {
    TUIBeautyTypeNone,
    TUIBeautyTypeBeauty,
    TUIBeautyTypeFilter,
    TUIBeautyTypeMotion,
    TUIBeautyTypeKoubei,
    TUIBeautyTypeCosmetic,
    TUIBeautyTypeGesture,
    TUIBeautyTypeGreen
};

#pragma mark - Base
@class TUIBeautyBaseItem;

@interface TUIBeautyBasePackage : NSObject

@property (nonatomic,  copy) NSString *title;

@property (nonatomic, assign) BOOL enableClearBtn;
@property (nonatomic, assign) BOOL enableSlider;

@property (nonatomic, assign) TUIBeautyType type;

@property (nonatomic, readonly) NSString *typeStr;

@property (nonatomic, strong) NSMutableArray <TUIBeautyBaseItem *>*items;

@property (nonatomic, nullable, readonly) TUIBeautyBaseItem *clearItem;

- (instancetype)initWithType:(TUIBeautyType)type title:(NSString *)title enableClearBtn:(BOOL)enableClearBtn enableSlider:(BOOL)enableSlider;
@end

@interface TUIBeautyBaseItem : NSObject

@property (nonatomic, weak) TUIBeautyBasePackage *package;

@property (nonatomic, assign) BOOL isSelected;

@property (nonatomic, assign) BOOL isClear;

@property (nonatomic, assign, readonly) TUIBeautyType type;

@property (nonatomic, copy) NSString *title;

@property (nonatomic, strong) UIImage *normalIcon;
@property (nonatomic, strong) UIImage *selectIcon;

@property (nonatomic, assign) float defaultValue;
@property (nonatomic, assign) float currentValue;
@property (nonatomic, assign) float minValue;
@property (nonatomic, assign) float maxValue;

@property (nonatomic, weak) id <TUIBeautyPanelActionPerformer> target;
@property (nonatomic, assign) SEL action;

@property (nonatomic, assign) int index;

@property (nonatomic, assign) BOOL isXmagic;
@property (nonatomic, strong) NSString *key;
@property (nonatomic, copy) NSDictionary *extraConfig;
@property (nonatomic, strong) NSString *path;
@property (nonatomic, strong) NSString *bundel;





- (instancetype)initWithTitle:(NSString *)title normalIcon:(UIImage *)normalIcon selIcon:(UIImage * _Nullable)selIcon package:(TUIBeautyBasePackage *)package isClear:(BOOL)isClear;

- (void)setValue:(float)current min:(float)min max:(float)max;

- (void)addTarget:(id)target action:(SEL _Nullable)action;

- (void)sendAction:(NSArray *)args;
- (void)setSlider:(float)value;
@end

#pragma mark - Beauty
@interface TUIBeautyBeautyItem : TUIBeautyBaseItem

@property (nonatomic, assign) int beautyStyle;
@property (nonatomic, assign) float beautyLevel;
@property (nonatomic, assign) float whiteLevel;
@property (nonatomic, assign) float ruddyLevel;

- (instancetype)initWithTitle:(NSString *)title normalIcon:(UIImage *)normalIcon package:(TUIBeautyBasePackage *)package target:(id)target action:(SEL)action currentValue:(float)currentValue minValue:(float)minValue maxValue:(float)maxValue;

- (void)applyBeautySettings;
@end

@interface TUIBeautyBeautyPackage : TUIBeautyBasePackage

- (void)decodeItems:(NSArray <NSDictionary *>*)array target:(id <TUIBeautyPanelActionPerformer>)target;

@end

#pragma mark - Filter
@interface TUIBeautyFilterItem : TUIBeautyBaseItem

@property (nonatomic, copy) NSString *lookupImagePath;
@property (nonatomic, copy) NSString *identifier;

- (instancetype)initWithTitle:(NSString *)title normalIcon:(UIImage *)normalIcon package:(TUIBeautyBasePackage *)package lookupImagePath:(NSString *)lookupImagePath target:(id <TUIBeautyPanelActionPerformer>)target currentValue:(float)currentValue minValue:(float)minValue maxValue:(float)maxValue identifier:(NSString *)identifier;

- (void)setFilter;
- (void)setSlider:(float)value;
@end

@interface TUIBeautyFilterPackage : TUIBeautyBasePackage

@property (nonatomic, class, readonly) NSArray *defaultFilterValue;

@end

#pragma mark - Motion
@interface TUIBeautyMotionItem : TUIBeautyBaseItem

@property (nonatomic, copy) NSString *identifier;
@property (nonatomic, copy) NSString *url;
@property (nonatomic, assign) BOOL isDownloading;
@property (nonatomic, readonly) BOOL isDownloaded;

- (instancetype)initWithTitle:(NSString *)title identifier:(NSString *)identifier url:(NSString *)url package:(TUIBeautyBasePackage *)package target:(id <TUIBeautyPanelActionPerformer>)target;

- (void)stopTask;
- (void)apply;

- (void)download:(void (^) (float prog))progress complete:(void (^) (BOOL success, NSString *message))complete;
@end

@interface TUIBeautyMotionPackage : TUIBeautyBasePackage

- (void)decodeItems:(NSArray <NSDictionary *>*)array target:(id <TUIBeautyPanelActionPerformer>)target;
- (void)decodeItems:(NSDictionary *) packageInfo;
@end

#pragma mark - Green
@interface TUIBeautyGreenItem : TUIBeautyBaseItem

@property (nonatomic, copy) NSString *url;

- (instancetype)initWithUrl:(NSString *)url title:(NSString *)title normalIcon:(NSString *)normalIcon package:(TUIBeautyBasePackage *)package target:(id <TUIBeautyPanelActionPerformer>)target;

@end

@interface TUIBeautyGreenPackage : TUIBeautyBasePackage

@end

NS_ASSUME_NONNULL_END
