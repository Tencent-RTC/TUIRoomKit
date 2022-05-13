// Copyright (c) 2019 Tencent. All rights reserved.

#import "TUIFilter.h"
#import "BeautyLocalized.h"

TUIFilterIdentifier const TUIFilterIdentifierNone      = @"";
TUIFilterIdentifier const TUIFilterIdentifierBaiXi     = @"baixi";
TUIFilterIdentifier const TUIFilterIdentifierNormal    = @"normal";
TUIFilterIdentifier const TUIFilterIdentifierZiRan     = @"ziran";
TUIFilterIdentifier const TUIFilterIdentifierYinghong  = @"yinghong";
TUIFilterIdentifier const TUIFilterIdentifierYunshang  = @"yunshang";
TUIFilterIdentifier const TUIFilterIdentifierChunzhen  = @"chunzhen";
TUIFilterIdentifier const TUIFilterIdentifierBailan    = @"bailan";
TUIFilterIdentifier const TUIFilterIdentifierYuanqi    = @"yuanqi";
TUIFilterIdentifier const TUIFilterIdentifierChaotuo   = @"chaotuo";
TUIFilterIdentifier const TUIFilterIdentifierXiangfen  = @"xiangfen";
TUIFilterIdentifier const TUIFilterIdentifierWhite     = @"white";
TUIFilterIdentifier const TUIFilterIdentifierLangman   = @"langman";
TUIFilterIdentifier const TUIFilterIdentifierQingxin   = @"qingxin";
TUIFilterIdentifier const TUIFilterIdentifierWeimei    = @"weimei";
TUIFilterIdentifier const TUIFilterIdentifierFennen    = @"fennen";
TUIFilterIdentifier const TUIFilterIdentifierHuaijiu   = @"huaijiu";
TUIFilterIdentifier const TUIFilterIdentifierLandiao   = @"landiao";
TUIFilterIdentifier const TUIFilterIdentifierQingliang = @"qingliang";
TUIFilterIdentifier const TUIFilterIdentifierRixi      = @"rixi";

@implementation TUIFilter

- (instancetype)initWithIdentifier:(TUIFilterIdentifier)identifier
                   lookupImagePath:(NSString *)lookupImagePath
{
    if (self = [super init]) {
        _identifier = identifier;
        _lookupImagePath = lookupImagePath;
    }
    return self;
}
@end

@implementation TUIFilterManager
{
    NSDictionary<TUIFilterIdentifier, TUIFilter*> *_filterDictionary;
}

+ (instancetype)defaultManager
{
    static TUIFilterManager *defaultManager = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        defaultManager = [[TUIFilterManager alloc] init];
    });
    return defaultManager;
}

- (instancetype)init
{
    self = [super init];
    if (self) {
//        _xMagicfilterItems = [self getFilterItems];
        NSBundle *bundle = TUIBeautyBundle();
        NSString *path = [bundle pathForResource:@"FilterResource" ofType:@"bundle"];
        NSFileManager *manager = [[NSFileManager alloc] init];
        if ([manager fileExistsAtPath:path]) {
            NSArray<TUIFilterIdentifier> *availableFilters = @[
                TUIFilterIdentifierBaiXi,
                TUIFilterIdentifierNormal,
                TUIFilterIdentifierZiRan,
                TUIFilterIdentifierYinghong,
                TUIFilterIdentifierYunshang,
                TUIFilterIdentifierChunzhen,
                TUIFilterIdentifierBailan,
                TUIFilterIdentifierYuanqi,
                TUIFilterIdentifierChaotuo,
                TUIFilterIdentifierXiangfen,
                TUIFilterIdentifierWhite,
                TUIFilterIdentifierLangman,
                TUIFilterIdentifierQingxin,
                TUIFilterIdentifierWeimei,
                TUIFilterIdentifierFennen,
                TUIFilterIdentifierHuaijiu,
                TUIFilterIdentifierLandiao,
                TUIFilterIdentifierQingliang,
                TUIFilterIdentifierRixi];
            NSMutableArray<TUIFilter *> *filters = [[NSMutableArray alloc] initWithCapacity:availableFilters.count];
            NSMutableDictionary<TUIFilterIdentifier, TUIFilter*> *filterMap = [[NSMutableDictionary alloc] initWithCapacity:availableFilters.count];
            for (TUIFilterIdentifier identifier in availableFilters) {
                NSString * itemPath = [path stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.png", identifier]];
                if ([manager fileExistsAtPath:path]) {
                    TUIFilter *filter = [[TUIFilter alloc] initWithIdentifier:identifier lookupImagePath:itemPath];
                    [filters addObject:filter];
                    filterMap[identifier] = filter;
                }
            }
            _allFilters = filters;

        }
    }
    return self;
}

- (TUIFilter *)filterWithIdentifier:(TUIFilterIdentifier)identifier;
{
    return _filterDictionary[identifier];
}

- (NSMutableArray *)getFilterItems {
    NSMutableArray *filterItems = [[NSMutableArray alloc]init];
    NSString *filterpath = [TUIBeautyBundle() pathForResource:@"TUIFilter" ofType:@"json"];
    if (!filterpath) {
        return nil;
    }
    NSData *data = [NSData dataWithContentsOfFile:filterpath];
    if (!data) {
        return nil;
    }
    NSError *error;
    NSDictionary *root = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if (error || ![root isKindOfClass:[NSDictionary class]]) {
        return nil;
    }
    
    if (![root.allKeys containsObject:@"package"]) {
        return nil;
    }
    
    NSArray *arr = root[@"items"];
    if (![arr isKindOfClass:[NSArray class]]) {
        return nil;
    }
    
    for (NSDictionary *item in arr) {
        NSString *bundleStr = [item objectForKey:@"bundle"];
        NSBundle *bundle = TUIBeautyBundle();
        NSString *iconPath = [bundle pathForResource:bundleStr ofType:@"bundle"];
        if (iconPath == nil) {
            continue;
        }
       NSArray *lutIDS = [item objectForKey:@"lutIDS"];
        for (NSDictionary *lutID in lutIDS) {
            NSString *path = [lutID objectForKey:@"path"];
            NSString *key = [lutID objectForKey:@"key"];
            NSNumber *strength = [lutID objectForKey:@"strength"];

            NSString *itemPath = [iconPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@",path]];
            NSFileManager *manager = [[NSFileManager alloc] init];
            if ([manager fileExistsAtPath:itemPath]) {
                TUIFilter *filter = [[TUIFilter alloc] initWithIdentifier:key lookupImagePath:itemPath];
                filter.title = [lutID objectForKey:@"title"];
                filter.isXmagic = YES;
                filter.path = path;
                filter.strength = strength;
                [filterItems addObject:filter];
            }
        }
    }
    return filterItems;
}
@end
