// Copyright (c) 2019 Tencent. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef NSString * TUIFilterIdentifier NS_STRING_ENUM;

extern TUIFilterIdentifier const TUIFilterIdentifierNone;
extern TUIFilterIdentifier const TUIFilterIdentifierBaiXi;
extern TUIFilterIdentifier const TUIFilterIdentifierNormal;
extern TUIFilterIdentifier const TUIFilterIdentifierZiRan;
extern TUIFilterIdentifier const TUIFilterIdentifierYinghong;
extern TUIFilterIdentifier const TUIFilterIdentifierYunshang;
extern TUIFilterIdentifier const TUIFilterIdentifierChunzhen;
extern TUIFilterIdentifier const TUIFilterIdentifierBailan;
extern TUIFilterIdentifier const TUIFilterIdentifierYuanqi;
extern TUIFilterIdentifier const TUIFilterIdentifierChaotuo;
extern TUIFilterIdentifier const TUIFilterIdentifierXiangfen;
extern TUIFilterIdentifier const TUIFilterIdentifierWhite;
extern TUIFilterIdentifier const TUIFilterIdentifierLangman;
extern TUIFilterIdentifier const TUIFilterIdentifierQingxin;
extern TUIFilterIdentifier const TUIFilterIdentifierWeimei;
extern TUIFilterIdentifier const TUIFilterIdentifierFennen;
extern TUIFilterIdentifier const TUIFilterIdentifierHuaijiu;
extern TUIFilterIdentifier const TUIFilterIdentifierLandiao;
extern TUIFilterIdentifier const TUIFilterIdentifierQingliang;
extern TUIFilterIdentifier const TUIFilterIdentifierRixi;

@interface TUIFilter : NSObject
@property (readonly, nonatomic) TUIFilterIdentifier identifier;
@property (readonly, nonatomic) NSString *lookupImagePath;
@property (strong, nonatomic) NSString *title;
@property (nonatomic, assign) BOOL isXmagic;
@property (strong, nonatomic) NSNumber *strength;
@property (strong, nonatomic) NSString *path;



@end

@interface TUIFilterManager : NSObject
+ (instancetype)defaultManager;
@property (readonly, nonatomic) NSArray<TUIFilter *> *allFilters;
@property (nonatomic, strong) NSArray *xMagicfilterItems;
- (TUIFilter *)filterWithIdentifier:(TUIFilterIdentifier)identifier;
@end

NS_ASSUME_NONNULL_END
